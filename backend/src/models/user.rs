use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct UserReturnModel {
    pub zid: i32,
    pub first_name: String,
    pub last_name: String,
    pub is_org_admin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct UserPermissionCourseCodeModel {
    pub course_code: String,
    pub course_offering_id: i32,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfoBody {
    pub user_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfileReturnModel {
    pub zid: i32,
    pub is_org_admin: bool,
    pub first_name: String,
    pub last_name: String,
    pub tutor: Vec<UserPermissionCourseCodeModel>,
    pub course_admin: Vec<UserPermissionCourseCodeModel>,
}
