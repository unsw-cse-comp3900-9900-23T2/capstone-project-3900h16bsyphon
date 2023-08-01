use crate::{
    entities,
    models::{SyphonError, SyphonResult, Tag, TokenClaims, INV_CODE_LEN, TimeStampModel, GetTagAnalytics, QueueRequestInfoModel, RequestDuration, RequestTutorInformationModel, TutorInformationModel},
    utils::{
        db::db,
        user::{validate_admin, validate_user},
    },
};
use crate::{entities::sea_orm_active_enums::Statuses, models::course::*};
use actix_web::{
    http::StatusCode,
    web::{self, ReqData, Query},
    HttpResponse,
};
use chrono::{NaiveDate, NaiveDateTime, Utc};
use chrono_tz::Australia::Sydney;
use futures::future::{join_all, try_join_all};
use rand::Rng;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QuerySelect, PaginatorTrait,
};
use serde_json::json;

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
    query: web::Query<GetCourseTagsQuery>,
) -> SyphonResult<HttpResponse> {
    let db = db();
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
        .await?;
    tags.iter_mut().for_each(|tag| tag.is_priority = false);
    Ok(HttpResponse::Ok().json(web::Json(tags)))
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

pub async fn get_courses_admined(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = db();
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }

    let user = entities::users::Entity::find_by_id(token.username)
        .one(db)
        .await
        .unwrap()
        .unwrap();

    // if user is org admin, they can see the full list of courses
    if user.is_org_admin {
        return get_offerings(token).await;
    }

    let course_offering_result = entities::course_offerings::Entity::find()
        .right_join(entities::users::Entity)
        .filter(
            entities::tutors::Column::Zid
                .eq(token.username)
                .and(entities::tutors::Column::IsCourseAdmin.eq(true)),
        )
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

/// Add a tutor to the given courses (multiple).
/// ## Preconditions
/// - The user making the request must be a course admin
/// ## Returns
/// - Forbidden: if the user making the request is not a (course admin OR org user)
/// - 200 with empty body if successful return
/// - 400 if the course or any of the users dont not exist
pub async fn add_tutor_to_courses(
    token: ReqData<TokenClaims>,
    body: web::Json<AddTutorToCoursesBody>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let body = body.into_inner();

    let user = entities::users::Entity::find_by_id(token.username)
        .one(db)
        .await
        .unwrap()
        .unwrap();

    log::info!(
        "is org admin value inside add_tutor_to_course: {:?}",
        user.is_org_admin
    );

    for course_id in &body.course_ids {
        // Ensure if person adding the new tutor is not an org admin, they are a course admin
        if !user.is_org_admin {
            match entities::tutors::Entity::find_by_id((token.username, *course_id))
                .one(db)
                .await
                .expect("db broke")
            {
                None => return Err(SyphonError::Json(json!("Not Admin"), StatusCode::FORBIDDEN)),
                Some(t) if !t.is_course_admin => {
                    return Err(SyphonError::Json(json!("Not Admin"), StatusCode::FORBIDDEN))
                }
                Some(_) => {}
            }
        }

        let db_course = entities::course_offerings::Entity::find_by_id(*course_id)
            .one(db)
            .await
            .expect("db broke");
        let db_user = entities::users::Entity::find_by_id(body.tutor_id)
            .one(db)
            .await
            .expect("db broke");

        let (course, user) = match (db_course, db_user) {
            (Some(c), Some(t)) => (c, t),
            (Some(_), None) => {
                return Err(SyphonError::Json(
                    json!(vec!["user"]),
                    StatusCode::NOT_FOUND,
                ))
            }
            (None, Some(_)) => {
                return Err(SyphonError::Json(
                    json!(vec!["course"]),
                    StatusCode::NOT_FOUND,
                ))
            }
            (None, None) => {
                return Err(SyphonError::Json(
                    json!(vec!["course", "user"]),
                    StatusCode::NOT_FOUND,
                ))
            }
        };

        let db_tutor = entities::tutors::Entity::find_by_id((user.zid, course.course_offering_id))
            .one(db)
            .await
            .expect("db broke");

        // if already a tutor, work on the next course
        if db_tutor.is_some() {
            continue;
        }
        entities::tutors::ActiveModel {
            zid: ActiveValue::Set(user.zid),
            course_offering_id: ActiveValue::Set(course.course_offering_id),
            is_course_admin: ActiveValue::Set(false),
        }
        .insert(db)
        .await
        .expect("db broke");
    }

    Ok(HttpResponse::Ok().json("ok"))
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

    // Insert
    entities::tutors::Entity::insert(active_tutor)
        .exec(db)
        .await
        .expect("db broke");

    HttpResponse::Ok().json(web::Json(course))
}

pub async fn get_wait_time_analytics(
    query: web::Query<GetOfferingByIdQuery>,
) -> SyphonResult<HttpResponse> {
    let db = db();

    let tutors = entities::tutors::Entity::find()
        .left_join(entities::users::Entity)
        .select_only()
        .column(entities::tutors::Column::Zid)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .filter(entities::tutors::Column::CourseOfferingId.eq(query.course_id))
        .distinct_on([entities::tutors::Column::Zid])
        .into_model::<TutorAnalyticsInfo>()
        .all(db)
        .await?;

    let mut wait_times = Vec::new();

    for tutor in tutors.iter() {
        let all_requests = entities::requests::Entity::find()
            .left_join(entities::request_status_log::Entity)
            .left_join(entities::queues::Entity)
            .select_only()
            .column(entities::requests::Column::RequestId)
            .filter(
                entities::queues::Column::CourseOfferingId
                    .eq(query.course_id)
                    .and(entities::request_status_log::Column::TutorId.eq(tutor.zid)),
            )
            .distinct_on([entities::request_status_log::Column::RequestId])
            .into_model::<RequestInfo>()
            .all(db)
            .await?;

        let mut total_durations = 0;
        let mut total_request_count = 0;

        for request in all_requests.iter() {
            let creation_time = entities::request_status_log::Entity::find()
                .select_only()
                .column(entities::request_status_log::Column::EventTime)
                .filter(
                    entities::request_status_log::Column::RequestId
                        .eq(request.request_id)
                        .and(entities::request_status_log::Column::Status.eq(Statuses::Unseen)),
                )
                .into_model::<TimeStampModel>()
                .one(db)
                .await?;

            let start_time = entities::request_status_log::Entity::find()
                .select_only()
                .column(entities::request_status_log::Column::EventTime)
                .filter(
                    entities::request_status_log::Column::RequestId
                        .eq(request.request_id)
                        .and(entities::request_status_log::Column::Status.eq(Statuses::Seeing)),
                )
                .into_model::<TimeStampModel>()
                .one(db)
                .await?;
            match (creation_time, start_time) {
                (Some(create), Some(start)) => {
                    total_durations += start
                        .event_time
                        .signed_duration_since(create.event_time)
                        .num_minutes();
                    total_request_count += 1;
                }
                (Some(create), None) => {
                    let start = get_request_start_time(request.request_id).await;
                    total_durations += start.signed_duration_since(create.event_time).num_minutes();
                    total_request_count += 1;
                }
                _ => {}
            }
        }
        // push the average for each tutor
        wait_times.push(AnalyticsWaitTime {
            full_name: tutor.first_name.clone() + " " + &tutor.last_name.clone(),
            average_wait: if total_request_count == 0 {
                0
            } else {
                total_durations / total_request_count
            },
        });
    }

    /////////////////////////////////////// Final Result //////////////////////////////////////
    let analytics_wait_time_result = AnalyticsWaitTimeResult { wait_times };

    Ok(HttpResponse::Ok().json(analytics_wait_time_result))
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

pub async fn get_request_start_time(request_id: i32) -> NaiveDateTime {
    // get the queue info
    let queue = entities::queues::Entity::find()
        .left_join(entities::requests::Entity)
        .filter(entities::requests::Column::RequestId.eq(request_id))
        .one(db())
        .await
        .expect("db broke")
        .unwrap();

    // check if queue has finished
    if !queue.is_available && !queue.is_visible {
        return queue.end_time;
    }

    // otherwise queue is still going -> return current time
    Utc::now().with_timezone(&Sydney).naive_local()
}

pub async fn get_tag_analytics(query: Query<GetTagAnalytics>) -> SyphonResult<HttpResponse> {
    let db = db();

    // get queue ids that match course offering id
    let queue_ids: Vec<i32> = entities::queues::Entity::find()
        .column(entities::queues::Column::QueueId)
        .filter(entities::queues::Column::CourseOfferingId.eq(query.course_offering_id))
        .into_tuple()
        .all(db)
        .await?;

    // get tag ids that match queue ids    
    let tag_list = entities::queue_tags::Entity::find()
        .select_only()
        .left_join(entities::tags::Entity)
        .column(entities::tags::Column::TagId)
        .column(entities::tags::Column::Name)
        .column(entities::queue_tags::Column::IsPriority)
        .filter(entities::queue_tags::Column::QueueId.is_in(queue_ids.clone()))
        .into_model::<Tag>()
        .all(db)
        .await?;

    // get list of request ids for each tag id and push to the array
    let mut tag_analytics = Vec::new();

    for tag in &tag_list {
        let request_ids: Vec<i32> = entities::request_tags::Entity::find()
            .column(entities::request_tags::Column::RequestId)
            .filter(entities::request_tags::Column::TagId.eq(tag.tag_id))
            .into_tuple()
            .all(db)
            .await?;

        tag_analytics.push(TagAnalytics {
            tag_id: tag.tag_id,
            name: tag.name.clone(),
            is_priority: tag.is_priority,
            request_ids,
        });
    }

    Ok(HttpResponse::Ok().json(tag_analytics))
}

pub async fn get_consultation_analytics(web::Json(body): web::Json<ConsultationAnalyticsBody>) -> SyphonResult<HttpResponse> {
    let db = db();

    // TODO: figure how to separate by hour
    
    // get queue ids that match course offering id and are located between the start and end time
    let queue_ids: Vec<i32> = entities::queues::Entity::find()
        .column(entities::queues::Column::QueueId)
        .filter(entities::queues::Column::CourseOfferingId.eq(body.course_id))
        .filter(entities::queues::Column::StartTime.gt(body.start_time))
        .filter(entities::queues::Column::EndTime.lt(body.end_time))
        .into_tuple()
        .all(db)
        .await
        .expect("db broke");

    // get request ids that match queue ids
    let request_list = entities::requests::Entity::find()
        .select_only()
        .left_join(entities::users::Entity)
        .column(entities::requests::Column::RequestId)
        .column(entities::requests::Column::Zid)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .filter(entities::requests::Column::QueueId.is_in(queue_ids.clone()))
        .into_model::<QueueRequestInfoModel>()
        .all(db)
        .await?;

    // get list of queue tutors
    let tutor_list = entities::request_status_log::Entity::find()
        .select_only()
        .left_join(entities::users::Entity)
        .left_join(entities::requests::Entity)
        .column(entities::requests::Column::Zid)
        .column(entities::request_status_log::Column::TutorId)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .filter(entities::requests::Column::QueueId.is_in(queue_ids.clone()))
        .distinct_on([entities::request_status_log::Column::TutorId])
        .into_model::<RequestTutorInformationModel>()
        .all(db)
        .await?
        .into_iter()
        .filter(|x| x.zid != x.tutor_id)
        .map(|x| TutorInformationModel {
            zid: x.tutor_id,
            first_name: x.first_name,
            last_name: x.last_name,
        })
        .collect::<Vec<_>>();

    let mut consult_analytics = Vec::new();
    log::info!("req list: {:?}", request_list);

    for consult in &request_list {
        // calculate num students unseen
        let num_students_unseen = entities::request_status_log::Entity::find()
            .filter(entities::request_status_log::Column::RequestId.eq(consult.request_id))
            .filter(entities::request_status_log::Column::Status.eq(Statuses::Unseen))
            .select_only()
            .left_join(entities::requests::Entity)
            .column(entities::request_status_log::Column::RequestId)
            .column(entities::requests::Column::Zid)
            .distinct()
            .count(db)
            .await
            .unwrap_or(0) as i32;

        // calculate num students seen
        let num_students_seen = entities::request_status_log::Entity::find()
            .filter(entities::request_status_log::Column::RequestId.eq(consult.request_id))
            .filter(entities::request_status_log::Column::Status.eq(Statuses::Seen))
            .select_only()
            .left_join(entities::requests::Entity)
            .column(entities::request_status_log::Column::RequestId)
            .column(entities::requests::Column::Zid)
            .distinct()
            .count(db)
            .await
            .unwrap_or(0) as i32;

        // calculate avg wait time
        let mut total_num_requests = 0;

        let wait_start_times = request_list
            .iter()
            .map(|x| {
                entities::request_status_log::Entity::find()
                    .select_only()
                    .column(entities::request_status_log::Column::EventTime)
                    .left_join(entities::requests::Entity)
                    .filter(entities::request_status_log::Column::RequestId.eq(x.request_id))
                    .filter(entities::request_status_log::Column::Status.eq(Statuses::Unseen))
                    .filter(entities::requests::Column::QueueId.is_in(queue_ids.clone()))
                    .into_model::<TimeStampModel>()
                    .one(db)
            })
            .collect::<Vec<_>>();
        let wait_start_times = try_join_all(wait_start_times).await?;

        let wait_end_times = request_list
            .iter()
            .map(|x| {
                entities::request_status_log::Entity::find()
                    .select_only()
                    .column(entities::request_status_log::Column::EventTime)
                    .left_join(entities::requests::Entity)
                    .filter(entities::request_status_log::Column::RequestId.eq(x.request_id))
                    .filter(entities::request_status_log::Column::Status.eq(Statuses::Seeing))
                    .filter(entities::requests::Column::QueueId.is_in(queue_ids.clone()))
                    .into_model::<TimeStampModel>()
                    .one(db)
            })
            .collect::<Vec<_>>();
        let wait_end_times = try_join_all(wait_end_times).await?;

        let mut wait_time_seconds = 0;
        for (i, start_time) in wait_start_times.iter().enumerate() {
            let end_time = wait_end_times[i].clone();
            let _duration = start_time.as_ref().map(|start_t| {
                if let Some(end_t) = end_time {
                    wait_time_seconds += end_t
                        .event_time
                        .signed_duration_since(start_t.event_time)
                        .num_seconds();
                    total_num_requests += 1;
                }
            });
        }

        // calculate time spent idle
        let mut idle_time_seconds = 0;

        for tutor in &tutor_list {
            // calculate start times of when tutor started being idle
            let idle_start_times = tutor_list
                .iter()
                .map(|_x| {
                    entities::request_status_log::Entity::find()
                        .select_only()
                        .column(entities::request_status_log::Column::EventTime)
                        .left_join(entities::requests::Entity)
                        .filter(entities::request_status_log::Column::TutorId.eq(tutor.zid))
                        .filter(entities::request_status_log::Column::Status.eq(Statuses::NotFound))
                        .filter(entities::requests::Column::QueueId.is_in(queue_ids.clone()))
                        .into_model::<TimeStampModel>()
                        .one(db)
                })
                .collect::<Vec<_>>();
            let idle_start_times = try_join_all(idle_start_times).await?;
        
            // calculate end times of when tutor stopped being idle
            let idle_end_times = tutor_list
                .iter()
                .map(|_x| {
                    entities::request_status_log::Entity::find()
                        .select_only()
                        .column(entities::request_status_log::Column::EventTime)
                        .left_join(entities::requests::Entity)
                        .filter(entities::request_status_log::Column::TutorId.eq(tutor.zid))
                        .filter(entities::request_status_log::Column::Status.eq(Statuses::Seeing))
                        .filter(entities::requests::Column::QueueId.is_in(queue_ids.clone()))
                        .into_model::<TimeStampModel>()
                        .one(db)
                })
                .collect::<Vec<_>>();
            let idle_end_times = try_join_all(idle_end_times).await?;
            
            // calculate the idle time for the tutor and add it to the total
            for (i, start_time) in idle_start_times.iter().enumerate() {
                let end_time = idle_end_times[i].clone();
                let _duration = start_time.as_ref().map(|start_t| {
                    if let Some(end_t) = end_time {
                        idle_time_seconds += end_t
                            .event_time
                            .signed_duration_since(start_t.event_time)
                            .num_seconds();
                        total_num_requests += 1;
                    }
                });
            }
        }
        
        consult_analytics.push(ConsultationAnalyticsReturnModal {
            num_students_seen,
            num_students_unseen,
            avg_wait_time: RequestDuration {
                hours: ((wait_time_seconds / total_num_requests) / 3600) as i64,
                minutes: ((wait_time_seconds / total_num_requests) / 60) % 60 as i64,
                seconds: (wait_time_seconds % 60) as i64,
            },
            time_spent_idle: RequestDuration {
                hours: (idle_time_seconds / 3600) as i64,
                minutes: (idle_time_seconds / 60) % 60 as i64,
                seconds: (idle_time_seconds % 60) as i64,
            },
        })
    }

    Ok(HttpResponse::Ok().json(consult_analytics))
}