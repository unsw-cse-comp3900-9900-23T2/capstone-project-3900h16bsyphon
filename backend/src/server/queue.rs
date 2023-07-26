use crate::{
    entities::{self, sea_orm_active_enums::Statuses},
    models::{
        CloseQueueRequest, CreateQueueRequest, FlipTagPriority, GetActiveQueuesQuery,
        GetQueueByIdQuery, GetQueueRequestCount, GetQueueSummaryQuery, GetQueueTagsQuery,
        GetQueuesByCourseQuery, GetRemainingStudents, QueueAnalyticsSummaryModel,
        QueueInformationModel, QueueNameModel, QueueRequestInfoModel, QueueRequestSummaryModel,
        QueueReturnModel, QueueSummaryData, QueueTagSummaryData, QueueTutorSummaryData,
        RequestDuration, RequestId, RequestStatusTimeInfo, RequestTutorInformationModel,
        SyphonError, SyphonResult, Tag, TimeStampModel, TokenClaims, TutorInformationModel,
        UpdateQueuePreviousRequestCount, UpdateQueueRequest,
    },
    sockets::{lobby::Lobby, messages::HttpServerAction, SocketChannels},
    test_is_user,
    utils::{db::db, user::validate_user},
};
use actix::Addr;
use actix_web::{
    http::StatusCode,
    web::{self, Query, ReqData},
    HttpResponse,
};
use chrono::{DateTime, Duration, Utc};
use chrono_tz::Australia::Sydney;
use itertools::izip;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityOrSelect, EntityTrait, JoinType,
    PaginatorTrait, QueryFilter, QuerySelect, RelationTrait,
};

use futures::future::{join_all, try_join_all};
use serde_json::json;

pub async fn create_queue(
    token: ReqData<TokenClaims>,
    req_body: web::Json<CreateQueueRequest>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);
    let req_body = req_body.into_inner();
    let queue = entities::queues::ActiveModel::from(req_body.clone())
        .insert(db)
        .await
        .expect("Db broke");

    let tag_creation_futures = req_body
        .tags
        .iter()
        .filter(|tag| tag.tag_id == -1) // check if tag already exists
        .map(|tag| {
            entities::tags::ActiveModel {
                tag_id: ActiveValue::NotSet,
                name: ActiveValue::Set(tag.name.clone()),
            }
            .insert(db)
        });
    let new_tags = join_all(tag_creation_futures).await;
    let mut new_tags_iter = new_tags.into_iter();
    let tag_queue_addition = req_body.tags.iter().map(|tag| {
        // crazy: we iterate over the tags again, but this time we get their id if they arent given
        entities::queue_tags::ActiveModel {
            tag_id: ActiveValue::Set(if tag.tag_id != -1 {
                tag.tag_id
            } else {
                new_tags_iter.next().unwrap().unwrap().tag_id
            }),
            queue_id: ActiveValue::Set(queue.queue_id),
            is_priority: ActiveValue::Set(tag.is_priority),
        }
        .insert(db)
    });
    join_all(tag_queue_addition).await;
    HttpResponse::Ok().json(queue)
}

pub async fn get_queue_by_id(
    _token: ReqData<TokenClaims>,
    Query(query): Query<GetQueueByIdQuery>,
) -> SyphonResult<HttpResponse> {
    // match queue {
    //     Some(q) => HttpResponse::Ok().json(web::Json(q)),
    //     None => HttpResponse::NotFound().json("No queue of that id!"),
    // }
    Ok(HttpResponse::Ok().json(get_queue_by_id_not_web(query.queue_id).await?))
}

pub async fn get_queue_by_id_not_web(
    queue_id: i32,
) -> Result<entities::queues::Model, SyphonError> {
    let db = db();
    entities::queues::Entity::find_by_id(queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))
}

pub async fn get_queues_by_course(
    token: ReqData<TokenClaims>,
    query: Query<GetQueuesByCourseQuery>,
) -> HttpResponse {
    let db = db();
    if let Err(e) = validate_user(&token, db).await {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }
    let mut the_course = entities::course_offerings::Entity::find_by_id(query.course_id)
        .select_only()
        .left_join(entities::queues::Entity)
        .column(entities::course_offerings::Column::Title)
        .column(entities::course_offerings::Column::CourseCode)
        .column(entities::queues::Column::QueueId)
        .column(entities::queues::Column::StartTime)
        .column(entities::queues::Column::EndTime)
        .column(entities::queues::Column::Title)
        .column(entities::queues::Column::IsAvailable)
        .column(entities::queues::Column::IsVisible)
        .into_json()
        .all(db)
        .await
        .expect("db broke");
    let tutors = entities::tutors::Entity::find()
        .select_only()
        .left_join(entities::users::Entity)
        .column(entities::users::Column::FirstName)
        .filter(entities::tutors::Column::CourseOfferingId.eq(query.course_id))
        .filter(entities::tutors::Column::IsCourseAdmin.eq(true))
        .into_json()
        .all(db)
        .await
        .expect("db broke")
        .iter()
        .map(|json| {
            json.as_object()
                .unwrap()
                .get("first_name")
                .unwrap()
                .as_str()
                .unwrap()
                .to_string()
        })
        .collect::<Vec<_>>();

    the_course.iter_mut().for_each(|it| {
        it.as_object_mut()
            .unwrap()
            .insert("course_admins".to_owned(), tutors.clone().into());
    });
    HttpResponse::Ok().json(the_course)
}

pub async fn update_tag_priority(
    _: ReqData<TokenClaims>,
    body: web::Json<FlipTagPriority>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let item = match entities::queue_tags::Entity::find_by_id((body.tag_id, body.queue_id))
        .one(db)
        .await?
    {
        Some(item) => item,
        None => return Ok(HttpResponse::NotFound().json("No tag of that id!")),
    };
    let model = entities::queue_tags::ActiveModel {
        is_priority: ActiveValue::Set(body.is_priority),
        ..item.into()
    };
    model.update(db).await?;
    Ok(HttpResponse::Ok().json("Success!"))
}

pub async fn fetch_queue_tags(
    _token: ReqData<TokenClaims>,
    query: web::Query<GetQueueTagsQuery>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let tags = entities::queue_tags::Entity::find()
        .left_join(entities::tags::Entity)
        .filter(entities::queue_tags::Column::QueueId.eq(query.queue_id))
        .column(entities::queue_tags::Column::TagId)
        .distinct()
        .column(entities::queue_tags::Column::IsPriority)
        .column(entities::tags::Column::Name)
        .into_model::<Tag>()
        .all(db)
        .await?;
    Ok(HttpResponse::Ok().json(web::Json(tags)))
}

pub async fn get_is_open(
    token: ReqData<TokenClaims>,
    query: Query<GetActiveQueuesQuery>,
) -> HttpResponse {
    let db = db();
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }
    let queues_result = entities::queues::Entity::find()
        .select()
        .filter(entities::queues::Column::QueueId.eq(query.queue_id))
        .into_model::<QueueReturnModel>()
        .one(db)
        .await
        .expect("db broke");

    // return queues result result
    match queues_result {
        Some(queues_result) => HttpResponse::Ok().json(json!({
            "is_open" : web::Json(queues_result.is_available)
        })),
        None => HttpResponse::BadRequest().json("no queue found"),
    }
}

pub async fn update_queue(
    _token: ReqData<TokenClaims>,
    body: web::Json<UpdateQueueRequest>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    log::debug!("update queue: {:?}", body);

    let queue = entities::queues::Entity::find_by_id(body.queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!({"error" : "queue not found"}),
            StatusCode::NOT_FOUND,
        ))?;

    entities::queues::ActiveModel {
        queue_id: ActiveValue::Unchanged(body.queue_id),
        is_available: ActiveValue::Set(body.is_available),
        start_time: ActiveValue::Set(body.start_time),
        end_time: ActiveValue::Set(body.end_time),
        announcement: ActiveValue::Set(body.announcement.clone()),
        time_limit: ActiveValue::Set(body.time_limit),
        is_visible: ActiveValue::Set(body.is_visible),
        title: ActiveValue::Set(body.title.clone()),
        ..queue.clone().into()
    }
    .update(db)
    .await?;

    let action = HttpServerAction::InvalidateKeys(vec![SocketChannels::QueueData(body.queue_id)]);
    lobby.do_send(action);

    /////////////////   TAGS    ///////////////////////
    /*
        let tag_creation_futures = body
            .tags
            .iter()
            .filter(|tag| tag.tag_id == -1) // check if tag already exists
            .map(|tag| {
                entities::tags::ActiveModel {
                    tag_id: ActiveValue::NotSet,
                    name: ActiveValue::Set(tag.name.clone()),
                }
                .insert(db)
            });
        let new_tags = join_all(tag_creation_futures).await;
        let mut new_tags_iter = new_tags.into_iter();
        let tag_queue_addition = body.tags.iter().map(|tag| {
            // crazy: we iterate over the tags again, but this time we get their id if they arent given
            entities::queue_tags::ActiveModel {
                tag_id: ActiveValue::Set(if tag.tag_id != -1 {
                    tag.tag_id
                } else {
                    new_tags_iter.next().unwrap().unwrap().tag_id
                }),
                queue_id: ActiveValue::Set(queue.queue_id),
                is_priority: ActiveValue::Set(tag.is_priority),
            }
            .insert(db)
        });
        join_all(tag_queue_addition).await;
    */
    Ok(HttpResponse::Ok().json("Success!"))
}

pub async fn close_queue(body: web::Json<CloseQueueRequest>) -> SyphonResult<HttpResponse> {
    let db = db();
    log::info!("close queue");
    log::info!("{:?}", body);

    let queue = entities::queues::Entity::find_by_id(body.queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!({"error" : "queue not found"}),
            StatusCode::NOT_FOUND,
        ))?;

    // if the queue is already unavailable then we cant close it again so return error
    if !queue.is_available && !queue.is_visible {
        return Err(SyphonError::Json(
            json!({"error": "queue has already been closed"}),
            StatusCode::METHOD_NOT_ALLOWED,
        ));
    }

    // update the end time and set is_visible and is_available to false
    entities::queues::ActiveModel {
        queue_id: ActiveValue::Unchanged(body.queue_id),
        is_available: ActiveValue::Set(false),
        end_time: ActiveValue::Set(body.end_time),
        is_visible: ActiveValue::Set(false),
        ..queue.clone().into()
    }
    .update(db)
    .await?;

    Ok(HttpResponse::Ok().json("Success!"))
}

pub async fn set_is_sorted_by_previous_request_count(
    body: web::Json<UpdateQueuePreviousRequestCount>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let queue = entities::queues::Entity::find_by_id(body.queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(body.queue_id))?;
    entities::queues::ActiveModel {
        is_sorted_by_previous_request_count: sea_orm::ActiveValue::Set(
            body.is_sorted_by_previous_request_count,
        ),
        ..queue.into()
    }
    .update(db)
    .await?;
    Ok(HttpResponse::Ok().json("Success!"))
}

pub async fn get_student_count(query: Query<GetQueueRequestCount>) -> SyphonResult<HttpResponse> {
    let db = db();

    let requests = entities::requests::Entity::find()
        .left_join(entities::queues::Entity)
        .filter(entities::requests::Column::QueueId.eq(query.queue_id))
        .filter(entities::requests::Column::Status.eq(Statuses::Unseen))
        .filter(entities::queues::Column::IsAvailable.eq(true))
        .filter(entities::queues::Column::IsVisible.eq(true))
        .select_only()
        .column(entities::requests::Column::Zid)
        .distinct()
        .count(db)
        .await?;

    let req: i32 = requests.try_into().unwrap();

    Ok(HttpResponse::Ok().json(req))
}

pub async fn num_requests_until_close(
    query: Query<GetRemainingStudents>,
) -> SyphonResult<HttpResponse> {
    let db = db();

    // get the end time of the queue
    let queue = entities::queues::Entity::find_by_id(query.queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(query.queue_id))?;

    // https://www.youtube.com/watch?v=rksaoaqt3JA
    // FIXME: find a better way to convert end time
    let end_time =
        DateTime::<Utc>::from_utc(queue.end_time, Utc).with_timezone(&Sydney) - Duration::hours(10);
    let curr_time = Utc::now().with_timezone(&Sydney);

    // calculate time remaining
    let difference = (end_time - curr_time).num_minutes();

    // calculate the number of requests that can be resolved until the queue closes
    let res = match queue.time_limit {
        Some(0) => difference / 15,
        Some(_) => difference / queue.time_limit.unwrap() as i64,
        None => difference / 15,
    };
    log::debug!("res: {}", res);
    Ok(HttpResponse::Ok().json(res))
}

pub async fn get_queue_summary(query: Query<GetQueueSummaryQuery>) -> SyphonResult<HttpResponse> {
    let db = db();
    // given queueid

    // get queue information
    let queue = entities::queues::Entity::find_by_id(query.queue_id)
        .select_only()
        .left_join(entities::course_offerings::Entity)
        .column(entities::queues::Column::Title)
        .column(entities::queues::Column::StartTime)
        .column(entities::queues::Column::EndTime)
        .column(entities::course_offerings::Column::CourseCode)
        .into_model::<QueueInformationModel>()
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(query.queue_id))?;

    // get list of tutors for the queue
    let tutor_info_list = entities::request_status_log::Entity::find()
        .select_only()
        .left_join(entities::users::Entity)
        .left_join(entities::requests::Entity)
        .column(entities::requests::Column::Zid)
        .column(entities::request_status_log::Column::TutorId)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .filter(entities::requests::Column::QueueId.eq(query.queue_id))
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

    let total_seeing = tutor_info_list
        .iter()
        .map(|tutor_info| {
            entities::request_status_log::Entity::find()
                .select_only()
                .left_join(entities::requests::Entity)
                .column(entities::request_status_log::Column::RequestId)
                .column(entities::request_status_log::Column::EventTime)
                .filter(
                    entities::request_status_log::Column::TutorId
                        .eq(tutor_info.zid)
                        .and(entities::request_status_log::Column::Status.eq(Statuses::Seeing)),
                )
                .filter(entities::requests::Column::QueueId.eq(query.queue_id))
                .distinct_on([entities::request_status_log::Column::RequestId])
                .into_model::<RequestStatusTimeInfo>()
                .all(db)
        })
        .collect::<Vec<_>>();
    let total_seeing = try_join_all(total_seeing).await?;
    let total_seeing_count = total_seeing
        .iter()
        .map(|x| x.len() as i64)
        .collect::<Vec<_>>();

    let total_seen = tutor_info_list
        .iter()
        .map(|tutor_info| {
            entities::request_status_log::Entity::find()
                .select_only()
                .left_join(entities::requests::Entity)
                .column(entities::request_status_log::Column::RequestId)
                .column(entities::request_status_log::Column::EventTime)
                .filter(
                    entities::request_status_log::Column::TutorId
                        .eq(tutor_info.zid)
                        .and(entities::request_status_log::Column::Status.eq(Statuses::Seen)),
                )
                .filter(entities::requests::Column::QueueId.eq(query.queue_id))
                .distinct_on([entities::request_status_log::Column::RequestId])
                .into_model::<RequestStatusTimeInfo>()
                .all(db)
        })
        .collect::<Vec<_>>();
    let total_seen = try_join_all(total_seen).await?;
    let total_seen_count = total_seen
        .iter()
        .map(|x| x.len() as i64)
        .collect::<Vec<_>>();

    /////////////////////////////// Average Duration Per Tutor ///////////////////////////////
    let mut average_times = Vec::new();
    // for each of the total_seen
    for (i, tutor_seen_times) in total_seen.iter().enumerate() {
        let tutor_seeing_times = total_seeing[i].clone();
        // loop and get all the durations

        let mut duration_sum = 0; // getting the number of minutes
        for (j, seen_times) in tutor_seen_times.iter().enumerate() {
            let seeing_times = tutor_seeing_times[j].clone();
            if seeing_times.request_id != seen_times.request_id {
                continue;
            }
            // get the duration here
            duration_sum += seen_times
                .event_time
                .signed_duration_since(seeing_times.event_time)
                .num_minutes();
        }

        let average_duration = duration_sum / (tutor_seen_times.len() as i64);
        average_times.push(average_duration);
    }

    ///////////////////////////// Tags Each Tutor Worked On //////////////////////////////
    let tutors_tags_worked_on = tutor_info_list
        .iter()
        .map(|tutor_info| {
            entities::request_status_log::Entity::find()
                .select_only()
                .left_join(entities::requests::Entity)
                .column(entities::request_tags::Column::TagId)
                .column(entities::tags::Column::Name)
                .column(entities::queue_tags::Column::IsPriority)
                .join_rev(
                    JoinType::InnerJoin,
                    entities::request_tags::Relation::Requests.def(),
                )
                .join_rev(
                    JoinType::InnerJoin,
                    entities::tags::Entity::belongs_to(entities::request_tags::Entity)
                        .from(entities::tags::Column::TagId)
                        .to(entities::request_tags::Column::TagId)
                        .into(),
                )
                .join_rev(
                    JoinType::InnerJoin,
                    entities::queue_tags::Entity::belongs_to(entities::tags::Entity)
                        .from(entities::queue_tags::Column::TagId)
                        .to(entities::tags::Column::TagId)
                        .into(),
                )
                .filter(
                    entities::request_status_log::Column::TutorId
                        .eq(tutor_info.zid)
                        .and(entities::request_status_log::Column::Status.eq(Statuses::Seen)),
                )
                .filter(entities::queue_tags::Column::QueueId.eq(query.queue_id))
                .distinct_on([entities::request_tags::Column::TagId])
                .into_model::<Tag>()
                .all(db)
        })
        .collect::<Vec<_>>();
    let tutors_tags_worked_on = try_join_all(tutors_tags_worked_on).await?;

    ////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////// Join Tutor Summaries Together ///////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
    let tutor_zipped_summaries = izip!(
        tutor_info_list,
        total_seeing_count,
        total_seen_count,
        average_times,
        tutors_tags_worked_on
    );

    let tutor_summaries = tutor_zipped_summaries
        .map(|(a, b, c, d, e)| QueueTutorSummaryData {
            zid: a.zid,
            first_name: a.first_name.clone(),
            last_name: a.last_name,
            total_seen: c,
            total_seeing: b,
            average_time: d,
            tags_worked_on: e,
        })
        .collect::<Vec<_>>();

    ////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// Tag Summaries /////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // get list of tags for the queue
    let tag_list = entities::queue_tags::Entity::find()
        .select_only()
        .left_join(entities::tags::Entity)
        .column(entities::tags::Column::TagId)
        .column(entities::tags::Column::Name)
        .column(entities::queue_tags::Column::IsPriority)
        .filter(entities::queue_tags::Column::QueueId.eq(query.queue_id))
        .into_model::<Tag>()
        .all(db)
        .await?;

    // for every tag, get list of request ids for that tag
    let tag_request_ids = tag_list
        .iter()
        .map(|tag| {
            entities::request_tags::Entity::find()
                .select_only()
                .column(entities::request_tags::Column::RequestId)
                .distinct_on([entities::request_tags::Column::RequestId])
                .filter(entities::request_tags::Column::TagId.eq(tag.tag_id))
                .into_model::<RequestId>()
                .all(db)
        })
        .collect::<Vec<_>>();
    let tag_request_ids = try_join_all(tag_request_ids).await?;

    let mut tag_summaries = Vec::new();
    // for every tag, for every request id, find start and end time, and sum them
    for (i, request_ids) in tag_request_ids.iter().enumerate() {
        // get log for the first start_time (will not exist if student resolved themselves)
        let start_times = request_ids
            .iter()
            .map(|x| {
                entities::request_status_log::Entity::find()
                    .select_only()
                    .column(entities::request_status_log::Column::EventTime)
                    .left_join(entities::requests::Entity)
                    .filter(entities::request_status_log::Column::RequestId.eq(x.request_id))
                    .filter(entities::request_status_log::Column::Status.eq(Statuses::Seeing))
                    .filter(entities::requests::Column::QueueId.eq(query.queue_id))
                    .into_model::<TimeStampModel>()
                    .one(db)
            })
            .collect::<Vec<_>>();
        let start_times = try_join_all(start_times).await?;

        // get log for the end_time (will not exist if tutor did not get around to resolving them)
        let end_times = request_ids
            .iter()
            .map(|x| {
                entities::request_status_log::Entity::find()
                    .select_only()
                    .column(entities::request_status_log::Column::EventTime)
                    .left_join(entities::requests::Entity)
                    .filter(entities::request_status_log::Column::RequestId.eq(x.request_id))
                    .filter(entities::request_status_log::Column::Status.eq(Statuses::Seen))
                    .filter(entities::requests::Column::QueueId.eq(query.queue_id))
                    .into_model::<TimeStampModel>()
                    .one(db)
            })
            .collect::<Vec<_>>();
        let end_times = try_join_all(end_times).await?;

        // get all the durations
        let mut tag_durations_mins = 0;
        let mut tag_durations_hours = 0;
        let mut tag_durations_seconds = 0;
        for (i, start_time) in start_times.iter().enumerate() {
            let end_time = end_times[i].clone();
            let _duration = start_time.as_ref().map(|start_t| {
                if let Some(end_t) = end_time {
                    tag_durations_mins += end_t
                        .event_time
                        .signed_duration_since(start_t.event_time)
                        .num_minutes();
                    tag_durations_hours += end_t
                        .event_time
                        .signed_duration_since(start_t.event_time)
                        .num_hours();
                    tag_durations_seconds += end_t
                        .event_time
                        .signed_duration_since(start_t.event_time)
                        .num_seconds();
                }
            });
        }

        // sum them together for total duration
        tag_summaries.push(QueueTagSummaryData {
            tag: tag_list[i].clone(),
            duration: RequestDuration {
                hours: tag_durations_hours,
                minutes: tag_durations_mins,
                seconds: tag_durations_seconds,
            },
        });
    }

    //////////////////////////////////// Queue Timestamps /////////////////////////////////////////
    let time_difference = queue.end_time.signed_duration_since(queue.start_time);
    let duration = RequestDuration {
        hours: time_difference.num_hours(),
        minutes: time_difference.num_minutes(),
        seconds: time_difference.num_seconds(),
    };

    /////////////////////////////////////// Final Result //////////////////////////////////////

    let queue_summary_result = QueueSummaryData {
        title: queue.title,
        course_code: queue.course_code,
        start_time: TimeStampModel {
            event_time: queue.start_time,
        },
        end_time: TimeStampModel {
            event_time: queue.end_time,
        },
        duration,
        tutor_summaries,
        tag_summaries,
    };

    Ok(HttpResponse::Ok().json(queue_summary_result))
}

pub async fn get_queue_analytics(query: Query<GetQueueSummaryQuery>) -> SyphonResult<HttpResponse> {
    let db = db();

    // get queue information
    let queue = entities::queues::Entity::find_by_id(query.queue_id)
        .select_only()
        .left_join(entities::course_offerings::Entity)
        .column(entities::queues::Column::Title)
        .column(entities::course_offerings::Column::CourseCode)
        .into_model::<QueueNameModel>()
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(query.queue_id))?;

    // get all the requests made in the queue
    let all_requests = entities::requests::Entity::find()
        .select_only()
        .left_join(entities::users::Entity)
        .column(entities::requests::Column::RequestId)
        .column(entities::requests::Column::Zid)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .filter(entities::requests::Column::QueueId.eq(query.queue_id))
        .into_model::<QueueRequestInfoModel>()
        .all(db)
        .await?;

    let mut requests = Vec::new();
    let mut students_resolved = 0;

    for (i, request) in all_requests.iter().enumerate() {
        let start_time = entities::request_status_log::Entity::find()
            .select_only()
            .column(entities::request_status_log::Column::EventTime)
            .filter(entities::request_status_log::Column::RequestId.eq(request.request_id))
            .filter(entities::request_status_log::Column::Status.eq(Statuses::Seeing))
            .into_model::<TimeStampModel>()
            .one(db)
            .await?;

        let end_time = entities::request_status_log::Entity::find()
            .select_only()
            .column(entities::request_status_log::Column::EventTime)
            .filter(entities::request_status_log::Column::RequestId.eq(request.request_id))
            .filter(entities::request_status_log::Column::Status.eq(Statuses::Seen))
            .into_model::<TimeStampModel>()
            .one(db)
            .await?;

        match (start_time, end_time) {
            (None, Some(_)) => {
                requests.push(QueueRequestSummaryModel {
                    zid: request.zid,
                    request_id: request.request_id,
                    first_name: request.first_name.clone(),
                    last_name: request.last_name.clone(),
                    is_self_resolved: true,
                    duration: None,
                });
                students_resolved += 1;
            }
            (Some(start), Some(end)) => {
                // get duration
                let duration = end.event_time.signed_duration_since(start.event_time);
                requests.push(QueueRequestSummaryModel {
                    zid: request.zid,
                    request_id: request.request_id,
                    first_name: request.first_name.clone(),
                    last_name: request.last_name.clone(),
                    is_self_resolved: false,
                    duration: Some(RequestDuration {
                        hours: duration.num_hours(),
                        minutes: duration.num_minutes(),
                        seconds: duration.num_seconds(),
                    }),
                });
                students_resolved += 1;
            }
            _ => {
                requests.push(QueueRequestSummaryModel {
                    zid: request.zid,
                    request_id: request.request_id,
                    first_name: request.first_name.clone(),
                    last_name: request.last_name.clone(),
                    is_self_resolved: false,
                    duration: None,
                });
            }
        }
    }

    /////////////////////////////////////// Final Result //////////////////////////////////////
    let queue_summary_result = QueueAnalyticsSummaryModel {
        title: queue.title,
        course_code: queue.course_code,
        students_joined: all_requests.len() as i32,
        students_resolved,
        students_unresolved: (all_requests.len() as i32) - students_resolved,
        requests
    };

    Ok(HttpResponse::Ok().json(queue_summary_result))
}
