use actix_web::{web, HttpResponse};
use rand::Rng;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};

use crate::{database_utils::db_connection, entities};

use super::auth::TokenClaims;

struct CreateOfferingBody {
    course_code: String,
    title: String,
}

pub async fn create_offering(
    token: TokenClaims,
    body: web::Json<CreateOfferingBody>,
) -> HttpResponse {
    let creator_id = token.username;
    let db = &db_connection().await;
    let user = entities::users::Entity::find_by_id(creator_id)
        .one(db)
        .await;

    match user {
        Ok(Some(user)) => {
            if !user.is_org_admin {
                return HttpResponse::Forbidden().body("u no admin");
            }
        }
        Ok(None) => return HttpResponse::Forbidden().body("u no exist"),
        Err(e) => {
            log::warn!("Db broke?");
            return HttpResponse::InternalServerError().body("Db broke?");
        }
    };

    // Create Course
    let body = body.into_inner();
    let active_course = entities::course_offerings::ActiveModel {
        course_offering_id: ActiveValue::NotSet,
        course_code: ActiveValue::Set(body.course_code),
        title: ActiveValue::Set(body.title),
        tutor_invite_code: ActiveValue::Set(Some(gen_unique_inv_code().await)),
    };

    let course = active_course.insert(db).await.expect("Db broke");
    log::info!("Created Course: {:?}", course);

    HttpResponse::Ok().json(web::Json(course))
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

const INV_CODE_LEN: usize = 6;

fn gen_inv_code() -> String {
    let mut rng = rand::thread_rng();
    (0..INV_CODE_LEN)
        .map(|_| match rng.gen() {
            true => rng.gen_range('a'..'z'),
            false => rng.gen_range('0'..'9'),
        })
        .collect()
}
