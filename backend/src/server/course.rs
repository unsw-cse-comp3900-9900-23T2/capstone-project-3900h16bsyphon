use actix_web::{
    web::{self, ReqData},
    HttpResponse,
};
use futures::executor::block_on;
use rand::Rng;
use regex::Regex;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, FromQueryResult, QueryFilter,
    QuerySelect,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{database_utils::db_connection, entities, server};

use models::{AddTutorToCourseBody, CreateOfferingBody, JoinWithTutorLink};

use server::{
    auth::TokenClaims,
    user::{validate_admin, validate_user},
};

use chrono::NaiveDate;

const INV_CODE_LEN: usize = 6;

pub async fn create_offering(
    token: ReqData<TokenClaims>,
    body: web::Json<CreateOfferingBody>,
) -> HttpResponse {
    let db = &db_connection().await;
    if let Err(err) = validate_admin(&token, db).await {
        return err;
    }

    // Validate Course Data
    if let Err(e) = body.validate() {
        return e;
    }

    // Create Course
    let body = body.into_inner();
    let active_course = entities::course_offerings::ActiveModel {
        course_offering_id: ActiveValue::NotSet,
        course_code: ActiveValue::Set(body.course_code),
        title: ActiveValue::Set(body.title),
        tutor_invite_code: ActiveValue::Set(Some(gen_unique_inv_code().await)),
        start_date: ActiveValue::Set(body.start_date.unwrap_or_else(today)),
    };

    let course = active_course.insert(db).await.expect("Db broke");
    log::info!("Created Course: {:?}", course);

    // Add admins
    body.admins
        .unwrap_or_default()
        .into_iter()
        .map(|id| add_course_admin(course.course_offering_id, id))
        .for_each(|f| block_on(f));

    HttpResponse::Ok().json(web::Json(course))
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct CourseOfferingReturnModel {
    course_offering_id: i32,
    course_code: String,
    title: String,
    start_date: Option<NaiveDate>,
    tutor_invite_code: Option<String>,
}

pub async fn get_offerings(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = &db_connection().await;
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }

    let course_offering_result = entities::course_offerings::Entity::find()
        .select_only()
        .column(entities::course_offerings::Column::CourseOfferingId)
        .column(entities::course_offerings::Column::CourseCode)
        .column(entities::course_offerings::Column::Title)
        .column(entities::course_offerings::Column::StartDate)
        .column(entities::course_offerings::Column::TutorInviteCode)
        .into_model::<CourseOfferingReturnModel>()
        .all(db)
        .await;
    // return course offering result
    match course_offering_result {
        Ok(course_offering_result) => HttpResponse::Ok().json(web::Json(course_offering_result)),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            HttpResponse::InternalServerError().json("Db Broke")
        }
    }
}

#[derive(Deserialize)]
pub struct GetOfferingByIdQuery {
    course_id: i32,
}

pub async fn get_offering_by_id(
    token: ReqData<TokenClaims>,
    body: web::Json<GetOfferingByIdQuery>,
) -> HttpResponse {
    let db = &db_connection().await;
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }

    let course_offering_result = entities::course_offerings::Entity::find_by_id(body.course_id)
        .select_only()
        .column(entities::course_offerings::Column::CourseOfferingId)
        .column(entities::course_offerings::Column::CourseCode)
        .column(entities::course_offerings::Column::Title)
        .column(entities::course_offerings::Column::StartDate)
        .filter(entities::tutors::Column::IsCourseAdmin.eq(true))
        .into_model::<CourseOfferingReturnModel>()
        .one(db)
        .await;
    // return course offering result
    match course_offering_result {
        Ok(course_offering_result) => HttpResponse::Ok().json(web::Json(course_offering_result)),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            HttpResponse::InternalServerError().json("Db Broke")
        }
    }
}

/// Add a tutor to the given course.
/// ## Preconditions
/// - The user making the request must be a course admin
/// ## Returns
/// - Forbidden: if the user making the request is not a course admin
/// - 200 with empty body if successful return
/// - 400 if the course or any of the users dont not exist
pub async fn add_tutor(
    token: ReqData<TokenClaims>,
    body: web::Json<AddTutorToCourseBody>,
) -> HttpResponse {
    let db = &db_connection().await;
    let body = body.into_inner();

    // Ensure person adding the new tutor is a course admin
    match entities::tutors::Entity::find_by_id((token.username, body.course_id))
        .one(db)
        .await
        .expect("db broke")
    {
        None => return HttpResponse::Forbidden().json("Not Admin"),
        Some(t) if !t.is_course_admin => return HttpResponse::Forbidden().json("Not Admin"),
        Some(_) => {}
    }

    let db_course = entities::course_offerings::Entity::find_by_id(body.course_id)
        .one(db)
        .await
        .expect("db broke");
    let db_user = entities::users::Entity::find_by_id(body.tutor_id)
        .one(db)
        .await
        .expect("db broke");

    let (course, user) = match (db_course, db_user) {
        (Some(c), Some(t)) => (c, t),
        (Some(_), None) => return not_exist_error(vec!["user"]),
        (None, Some(_)) => return not_exist_error(vec!["course"]),
        (None, None) => return not_exist_error(vec!["course", "user"]),
    };

    let db_tutor = entities::tutors::Entity::find_by_id((user.zid, course.course_offering_id))
        .one(db)
        .await
        .expect("db broke");

    if let Some(_) = db_tutor {
        return HttpResponse::Conflict().json("Already Tutor");
    }

    entities::tutors::ActiveModel {
        zid: ActiveValue::Set(user.zid),
        course_offering_id: ActiveValue::Set(course.course_offering_id),
        is_course_admin: ActiveValue::Set(false),
    }
    .insert(db)
    .await
    .expect("db broke");

    HttpResponse::Ok().json("ok")
}

/// Join a course using a tutor link. If already tutor, does nothing and is
/// still successful
/// ## Preconditions
/// - Tutor Link must be valid
/// ## Returns
/// - 200 with [`entities::course_offerings::Model`] if successful
/// - 400 if there is no course with the given tutor link
pub async fn join_with_tutor_link(
    token: ReqData<TokenClaims>,
    body: web::Json<JoinWithTutorLink>,
) -> HttpResponse {
    let body = body.into_inner();
    let db = &db_connection().await;
    // Get course from invite code
    let db_course = entities::course_offerings::Entity::find()
        .filter(entities::course_offerings::Column::TutorInviteCode.eq(body.tutor_link))
        .one(db)
        .await
        .expect("db broke");
    let course = match db_course {
        None => return not_exist_error(vec!["course"]),
        Some(course) => course,
    };

    // Create entry in tutors table
    let active_tutor = entities::tutors::ActiveModel {
        zid: ActiveValue::Set(token.username),
        course_offering_id: ActiveValue::Set(course.course_offering_id),
        is_course_admin: ActiveValue::Set(false),
    };

    // If already tutor, do nothing -> idempotent go brr
    if entities::tutors::Entity::find_by_id((token.username, course.course_offering_id))
        .one(db)
        .await
        .expect("db broke")
        .is_some()
    {
        return HttpResponse::Ok().json(web::Json(course));
    }

    // Insert
    entities::tutors::Entity::insert(active_tutor)
        .exec(db)
        .await
        .expect("db broke");

    HttpResponse::Ok().json(web::Json(course))
}

fn not_exist_error(missing: Vec<impl Into<String>>) -> HttpResponse {
    HttpResponse::BadRequest().json(json!({
        "err_type": "not_exist",
        "not_exist": missing.into_iter().map(|s| s.into()).collect::<Vec<String>>()
    }))
}

async fn add_course_admin(course_id: i32, tutor_id: i32) {
    let db = &db_connection().await;
    let active_tutor = entities::tutors::ActiveModel {
        zid: ActiveValue::Set(tutor_id),
        course_offering_id: ActiveValue::Set(course_id),
        is_course_admin: ActiveValue::Set(true),
    };
    let tutor = active_tutor.insert(db).await.expect("Db broke");
    log::info!("Added Tutor: {:?} to {:?}", tutor, course_id);
}

async fn gen_unique_inv_code() -> String {
    let db = &db_connection().await;
    loop {
        let code = gen_inv_code();
        let is_unique = entities::course_offerings::Entity::find()
            .filter(entities::course_offerings::Column::TutorInviteCode.contains(&code))
            .one(db)
            .await
            .expect("db brke")
            .is_none();
        if is_unique {
            return code;
        }
    }
}

fn gen_inv_code() -> String {
    let mut rng = rand::thread_rng();
    (0..INV_CODE_LEN)
        .map(|_| match rng.gen() {
            true => rng.gen_range('a'..'z'),
            false => rng.gen_range('0'..'9'),
        })
        .collect()
}

impl CreateOfferingBody {
    fn validate(&self) -> Result<(), HttpResponse> {
        let errs = json!({
            "course_code": Self::validate_code(&self.course_code).err(),
            "title": Self::validate_title(&self.title).err(),
            "admins": Self::validate_tutors(self.admins.as_ref().unwrap_or(&Vec::new())).err(),
        });
        if errs.as_object().unwrap().values().any(|v| !v.is_null()) {
            return Err(HttpResponse::BadRequest().json(errs));
        }
        Ok(())
    }

    fn validate_tutors(tutors: &Vec<i32>) -> Result<(), Vec<i32>> {
        let non_exist: Vec<i32> = tutors
            .into_iter()
            .filter(|id| !block_on(check_user_exists(**id)))
            .map(|id| *id)
            .collect();

        match non_exist.is_empty() {
            true => Ok(()),
            false => Err(non_exist),
        }
    }

    fn validate_title(title: &str) -> Result<(), String> {
        if title
            .chars()
            .any(|c| !c.is_ascii_alphanumeric() && !c.is_ascii_punctuation() && c != ' ')
        {
            return Err(String::from(
                "Only alphanumeric characters, spaces, and punctuation allowed",
            ));
        }
        if !(3..=26).contains(&title.len()) {
            return Err(String::from("Title must be between 3 and 26 characters"));
        }
        Ok(())
    }

    fn validate_code(code: &str) -> Result<(), String> {
        if !Regex::new("^[A-Z]{4}[0-9]{4}$").unwrap().is_match(code) {
            return Err(String::from(
                "Invalid Course Code. Must Match ^[A-Z]{4}[0-9]{4}$",
            ));
        }
        Ok(())
    }
}

/// Generate today's date in UTC as a NaiveDate
pub fn today() -> NaiveDate {
    chrono::Utc::now().naive_utc().date()
}

async fn check_user_exists(user_id: i32) -> bool {
    let db = &db_connection().await;
    entities::users::Entity::find_by_id(user_id)
        .one(db)
        .await
        .expect("db broke")
        .is_some()
}

mod models {
    use chrono::NaiveDate;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct CreateOfferingBody {
        pub course_code: String,
        pub title: String,
        pub start_date: Option<NaiveDate>,
        pub admins: Option<Vec<i32>>,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct AddTutorToCourseBody {
        pub tutor_id: i32,
        pub course_id: i32,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct JoinWithTutorLink {
        pub tutor_link: String,
    }
}
