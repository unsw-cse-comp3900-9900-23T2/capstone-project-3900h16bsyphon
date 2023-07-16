use crate::{
    entities,
    models::{
        CreateQueueRequest, FlipTagPriority, GetActiveQueuesQuery, GetQueueByIdQuery,
        GetQueueTagsQuery, GetQueuesByCourseQuery, QueueReturnModel, SyphonError, SyphonResult,
        Tag, TokenClaims, UpdateQueuePreviousRequestCount, UpdateQueueRequest,
    },
    test_is_user,
    utils::{db::db, user::validate_user},
};
use actix_web::{
    http::StatusCode,
    web::{self, Query, ReqData},
    HttpResponse,
};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityOrSelect, EntityTrait, QueryFilter,
    QuerySelect,
};

use futures::future::join_all;
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
    token: ReqData<TokenClaims>,
    query: Query<GetQueueByIdQuery>,
) -> HttpResponse {
    let db = db();
    if let Err(e) = validate_user(&token, db).await {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }
    let queue = entities::queues::Entity::find_by_id(query.queue_id)
        .one(db)
        .await
        .expect("Db broke");
    match queue {
        Some(q) => HttpResponse::Ok().json(web::Json(q)),
        None => HttpResponse::NotFound().json("No queue of that id!"),
    }
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

pub async fn update_queue(body: web::Json<UpdateQueueRequest>) -> SyphonResult<HttpResponse> {
    let db = db();
    log::info!("update queue");
    log::info!("{:?}", body);

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

    /////////////////   TAGS    ///////////////////////
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
