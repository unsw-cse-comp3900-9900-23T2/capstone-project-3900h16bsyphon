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

use crate::{
    database_utils::db_connection,
    entities,
    server::user::{validate_admin, validate_user},
};

use chrono::NaiveDate;

use super::auth::TokenClaims;

const INV_CODE_LEN: usize = 6;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOfferingBody {
    course_code: String,
    title: String,
    start_date: Option<NaiveDate>,
    admins: Vec<i32>,
}

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
            "admins": Self::validate_tutors(&self.admins).err(),
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
