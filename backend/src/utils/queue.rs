use actix_web::{web, HttpResponse};
use chrono::{DateTime, Duration, Utc};
use chrono_tz::Australia::Sydney;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, ModelTrait};

use crate::{
    entities,
    models::{self, queue},
    sockets::{messages::HttpServerAction, SocketChannels},
    utils::db::db,
};
use models::{SyphonError, SyphonResult};

use super::{db, course::get_admin_zids_for_course};

pub async fn num_requests_until_close_not_web(queue_id: i32) -> SyphonResult<i64> {
    let db = db();

    // get the end time of the queue
    let queue = entities::queues::Entity::find_by_id(queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))?;

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
    log::debug!("res requests till close for queue({}): {}", queue_id, res);

    Ok(res)
}

pub async fn unseen_requests_in_queue(queue_id: i32) -> SyphonResult<usize> {
    let db = db();

    let num_reqs = entities::queues::Entity::find_by_id(queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))?
        .find_related(entities::requests::Entity)
        .all(db)
        .await?
        .len();

    Ok(num_reqs)
}

// pub async fn () {

// }

pub async fn handle_possible_queue_capacity_overflow(
    zid: i32,
    queue_id: i32
) -> SyphonResult<Option<Vec<SocketChannels>>> {
    let capacity_left = num_requests_until_close_not_web(queue_id).await? as usize;
    let unseen_requests = unseen_requests_in_queue(queue_id).await?;

    if capacity_left >= unseen_requests {
        return Ok(None);
    }

    // Have ensured that overflow is happening, so deal w/ it
    create_capacity_overflow_notification(
        zid,
        queue_id,
        course_code_queue(queue_id).await?,
        capacity_left,
        unseen_requests,
    ).await?;

    // Notif Created succesfully, so we actually need to dipatch an action
    let course_id = course_code_queue(queue_id).await?;

    let actions = get_admin_zids_for_course(course_id)
        .await?
        .into_iter()
        .map(|zid| SocketChannels::Notifications(zid))
        .collect::<Vec<_>>();

    match actions.is_empty() {
        true => Ok(None),
        false => Ok(Some(actions)),
    }
}

pub async fn create_capacity_overflow_notification(
    zid: i32,
    queue_id: i32,
    course_id: i32,
    cap_left: usize,
    unseen_reqs: usize,
) -> SyphonResult<entities::notification::Model> {
    
    let content = format!(
        "In queue {} for course {} there are {} unseen requests but capacity for only {} more requests. Consider adding more tutors.",
        queue_id, course_id, unseen_reqs, cap_left, 
    );

    let notif = entities::notification::ActiveModel {
        seen: ActiveValue::Set(false),
        content: ActiveValue::Set(content),
        notif_id: ActiveValue::NotSet,
        zid: ActiveValue::Set(zid),
        created_at: ActiveValue::Set(Utc::now().with_timezone(&Sydney).naive_local()),
    }
    .insert(db())
    .await?;

    Ok(notif)
}

/// Returns the course_offering_id of the associated queue
pub async fn course_code_queue(queue_id: i32) -> SyphonResult<i32> {
    let course_id = entities::queues::Entity::find_by_id(queue_id)
        .one(db())
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))?
        .course_offering_id;

    Ok(course_id)
}
