

use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};


use crate::{
    entities,
    models::{SyphonResult},
};

use super::db::db;

pub async fn get_admins_for_course(course_id: i32) -> SyphonResult<Vec<entities::tutors::Model>> {
    let db = db();

    let admins = entities::tutors::Entity::find()
        .filter(entities::tutors::Column::CourseOfferingId.eq(course_id))
        .filter(entities::tutors::Column::IsCourseAdmin.eq(true))
        .all(db)
        .await?;

    Ok(admins)
}

pub async fn get_admin_zids_for_course(course_id: i32) -> SyphonResult<Vec<i32>> {
    Ok(get_admins_for_course(course_id)
        .await?
        .into_iter()
        .map(|u| u.zid)
        .collect())
}
