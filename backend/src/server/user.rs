use actix_web::{web::ReqData, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::{database_utils::db_connection, entities::{self}};

use crate::models::auth::TokenClaims;

use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, FromQueryResult, QueryFilter, QuerySelect, JoinType, RelationTrait,
};

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct UserReturnModel {
    zid: i32,
    first_name: String,
    last_name: String,
    is_org_admin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct UserPermissionCourseCodeModel {
    course_code: String,
    course_offering_id: i32,
    title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfileReturnModel {
    zid: i32,
    is_org_admin: bool,
    first_name: String,
    last_name: String,
    tutor: Vec<UserPermissionCourseCodeModel>,
    course_admin: Vec<UserPermissionCourseCodeModel>,
}

pub async fn get_users(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = &db_connection().await;

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

pub async fn get_user(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = &db_connection().await;

    if let Err(err) = validate_user(&token, db).await {
        return err;
    }
    
    let user_id = token.username;

    // get all courses user tutors 
    let tutors = entities::tutors::Entity::find()
        .select_only()
        .column(entities::course_offerings::Column::CourseCode)
        .column(entities::course_offerings::Column::CourseOfferingId)
        .column(entities::course_offerings::Column::Title)
        .filter(entities::tutors::Column::Zid.eq(user_id))
        .join(JoinType::InnerJoin, entities::tutors::Relation::CourseOfferings.def())
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
        .filter(entities::tutors::Column::Zid.eq(user_id).and(entities::tutors::Column::IsCourseAdmin.eq(true)))
        .join(JoinType::InnerJoin, entities::tutors::Relation::CourseOfferings.def())
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

pub async fn validate_user(
    token: &ReqData<TokenClaims>,
    db: &DatabaseConnection,
) -> Result<(), HttpResponse> {
    let creator_id = token.username;
    let user = entities::users::Entity::find_by_id(creator_id)
        .one(db)
        .await;

    match user {
        Ok(Some(_)) => Ok(()),
        Ok(None) => Err(HttpResponse::Forbidden().json("User Does Not Exist")),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            Err(HttpResponse::InternalServerError().json("Db Broke"))
        }
    }
}

pub async fn validate_admin(
    token: &ReqData<TokenClaims>,
    db: &DatabaseConnection,
) -> Result<(), HttpResponse> {
    let creator_id = token.username;
    let user = entities::users::Entity::find_by_id(creator_id)
        .one(db)
        .await;

    // Validate Admin Perms
    match user {
        Ok(Some(user)) => {
            if !user.is_org_admin {
                return Err(HttpResponse::Forbidden().json("Not Admin"));
            }
        }
        Ok(None) => return Err(HttpResponse::Forbidden().json("User Does Not Exist")),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            return Err(HttpResponse::InternalServerError().json("Db Broke"));
        }
    }
    Ok(())
}
