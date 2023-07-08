use actix_web::{
    web::{self, ReqData},
    HttpResponse,
};
use chrono::NaiveDate;
use futures::future::join_all;
use rand::Rng;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QuerySelect};
use serde_json::json;

use crate::{
    entities,
    models::{
        AddTutorToCourseBody, CourseOfferingReturnModel, CreateOfferingBody, GetCourseTagsQuery,
        GetOfferingByIdQuery, JoinWithTutorLink, SyphonResult, Tag, TokenClaims, INV_CODE_LEN,
    },
    test_is_user,
    utils::{
        db::db,
        user::{validate_admin, validate_user},
    },
};

pub async fn create_offering(
    token: ReqData<TokenClaims>,
    body: web::Json<CreateOfferingBody>,
) -> HttpResponse {
    let db = db();
    if let Err(err) = validate_admin(&token, db).await {
        return err;
    }

    // Validate Course Data
    if let Err(e) = body.validate().await {
        return e;
    }

    // Create Course
    let body = body.into_inner();
    let course = (entities::course_offerings::ActiveModel {
        course_offering_id: ActiveValue::NotSet,
        course_code: ActiveValue::Set(body.course_code),
        title: ActiveValue::Set(body.title),
        tutor_invite_code: ActiveValue::Set(Some(gen_unique_inv_code().await)),
        start_date: ActiveValue::Set(body.start_date.unwrap_or_else(today)),
    })
    .insert(db)
    .await
    .expect("Db broke");
    log::info!("Created Course: {:?}", course);

    // Add admins
    join_all(
        body.admins
            .unwrap_or_default()
            .into_iter()
            .map(|id| add_course_admin(course.course_offering_id, id)),
    )
    .await;

    HttpResponse::Ok().json(web::Json(course))
}

pub async fn get_offerings(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = db();
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

pub async fn fetch_course_tags(
    token: ReqData<TokenClaims>,
    query: web::Query<GetCourseTagsQuery>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);
    let mut tags = entities::queue_tags::Entity::find()
        .inner_join(entities::queues::Entity)
        .inner_join(entities::tags::Entity)
        .filter(entities::queues::Column::CourseOfferingId.eq(query.course_id))
        .column(entities::queue_tags::Column::TagId)
        .distinct_on([entities::queue_tags::Column::TagId])
        .column(entities::tags::Column::Name)
        .column(entities::queue_tags::Column::IsPriority)
        .into_model::<Tag>()
        .all(db)
        .await
        .expect("Db broke");
    tags.iter_mut().for_each(|tag| tag.is_priority = false);
    HttpResponse::Ok().json(web::Json(tags))
}

pub async fn get_courses_tutored(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = db();
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
        .right_join(entities::users::Entity)
        .filter(entities::tutors::Column::Zid.eq(token.username))
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

pub async fn get_offering_by_id(
    token: ReqData<TokenClaims>,
    body: web::Query<GetOfferingByIdQuery>,
) -> HttpResponse {
    let db = db();
    print!("validate");
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }
    print!("validated user!");

    let course_offering_result = entities::course_offerings::Entity::find_by_id(body.course_id)
        .select_only()
        .column(entities::course_offerings::Column::CourseOfferingId)
        .column(entities::course_offerings::Column::CourseCode)
        .column(entities::course_offerings::Column::Title)
        .column(entities::course_offerings::Column::StartDate)
        .column(entities::course_offerings::Column::TutorInviteCode)
        // .left_join(entities::users::Entity)
        // .filter(entities::tutors::Column::IsCourseAdmin.eq(true))
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
    let db = db();
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

    if db_tutor.is_some() {
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
    let db = db();
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

// TODO: THIS SHOULD BE A REAL TYPE
fn not_exist_error(missing: Vec<impl Into<String>>) -> HttpResponse {
    HttpResponse::BadRequest().json(json!({
        "err_type": "not_exist",
        "not_exist": missing.into_iter().map(|s| s.into()).collect::<Vec<String>>()
    }))
}

async fn add_course_admin(course_id: i32, tutor_id: i32) {
    let db = db();
    let active_tutor = entities::tutors::ActiveModel {
        zid: ActiveValue::Set(tutor_id),
        course_offering_id: ActiveValue::Set(course_id),
        is_course_admin: ActiveValue::Set(true),
    };
    let tutor = active_tutor.insert(db).await.expect("Db broke");
    log::info!("Added Tutor: {:?} to {:?}", tutor, course_id);
}

async fn gen_unique_inv_code() -> String {
    let db = db();
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
            true => rng.gen_range('a'..='z'),
            false => rng.gen_range('0'..='9'),
        })
        .collect()
}

/// Generate today's date in UTC as a NaiveDate
pub fn today() -> NaiveDate {
    chrono::Utc::now().naive_utc().date()
}

/// Check if a user exists
/// # Returns
/// - Ok(Ok(zid)) if user exists
/// - Ok(Err(zid)) if user does not exist
/// - Err(SyphonError) if db broke
pub async fn check_user_exists(user_id: i32) -> SyphonResult<Result<i32, i32>> {
    Ok(entities::users::Entity::find_by_id(user_id)
        .one(db())
        .await?
        .map(|u| u.zid)
        .ok_or(user_id))
}
