use actix_web::web;
use actix_web::{web::ReqData, HttpResponse};

use crate::models::auth::TokenClaims;
use crate::models::user::{*, self};
use crate::utils::user::validate_user;
use crate::{entities, utils::db::db};

use sea_orm::{ColumnTrait, EntityTrait, JoinType, QueryFilter, QuerySelect, RelationTrait};

pub async fn get_users(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = db();

    if let Err(err) = validate_user(&token, db).await {
        return err;
    }

    // get all users from db
    let users = entities::users::Entity::find()
        .select_only()
        .column(entities::users::Column::Zid)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .column(entities::users::Column::IsOrgAdmin)
        .filter(entities::users::Column::IsOrgAdmin.ne(true))
        .into_model::<UserReturnModel>()
        .all(db)
        .await;

    // return users
    match users {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            HttpResponse::InternalServerError().json("Db Broke")
        }
    }
}

pub async fn get_current_user(token: ReqData<TokenClaims>) -> HttpResponse {
    let body = UserInfoBody {
        user_id: token.username,
    };
    return get_user(token, actix_web::web::Query(body)).await;
}

pub async fn get_user(token: ReqData<TokenClaims>, body: web::Query<UserInfoBody>) -> HttpResponse {
    let db = db();

    if let Err(err) = validate_user(&token, db).await {
        return err;
    }

    let user_id = body.user_id;

    // get all courses user tutors
    let tutors = entities::tutors::Entity::find()
        .select_only()
        .columns([
            entities::course_offerings::Column::CourseCode,
            entities::course_offerings::Column::CourseOfferingId,
            entities::course_offerings::Column::Title,
        ])
        .filter(entities::tutors::Column::Zid.eq(user_id))
        .join(
            JoinType::InnerJoin,
            entities::tutors::Relation::CourseOfferings.def(),
        )
        .into_model::<UserPermissionCourseCodeModel>()
        .all(db)
        .await
        .unwrap();

    // get all courses user admins
    let admins = entities::tutors::Entity::find()
        .select_only()
        .column(entities::course_offerings::Column::CourseCode)
        .column(entities::course_offerings::Column::CourseOfferingId)
        .column(entities::course_offerings::Column::Title)
        .filter(
            entities::tutors::Column::Zid
                .eq(user_id)
                .and(entities::tutors::Column::IsCourseAdmin.eq(true)),
        )
        .join(
            JoinType::InnerJoin,
            entities::tutors::Relation::CourseOfferings.def(),
        )
        .into_model::<UserPermissionCourseCodeModel>()
        .all(db)
        .await
        .unwrap();

    // get single user from db
    let user = entities::users::Entity::find_by_id(user_id)
        .select_only()
        .column(entities::users::Column::Zid)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .column(entities::users::Column::IsOrgAdmin)
        .into_model::<UserReturnModel>()
        .one(db)
        .await
        .unwrap()
        .unwrap();

    let user_return = UserProfileReturnModel {
        zid: user.zid,
        first_name: user.first_name.clone(),
        last_name: user.last_name.clone(),
        is_org_admin: user.is_org_admin,
        tutor: tutors,
        course_admin: admins,
    };

    // return user
    HttpResponse::Ok().json(user_return)
}
