use crate::{
    auth::extractor::AuthUser,
    error::AppError,
    models::UserProfile,
    state::AppState,
};
use axum::{
    extract::{Path, Query, State},
    routing::{get, patch},
    Json, Router,
};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
    pub avatar: Option<String>,
    pub status: Option<String>,
    pub public_key: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UserSearchQuery {
    pub query: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/users/:uid", get(get_user))
        .route("/users/me", get(get_me).patch(update_me))
        .route("/users/search", get(search_users))
}

async fn get_user(
    State(state): State<AppState>,
    Path(uid): Path<String>,
) -> Result<Json<UserProfile>, AppError> {
    let user = state
        .firestore
        .get_document::<UserProfile>("users", &uid)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(user))
}

async fn get_me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<UserProfile>, AppError> {
    let user = state
        .firestore
        .get_document::<UserProfile>("users", &auth.uid)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(user))
}

async fn update_me(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(update): Json<UpdateProfileRequest>,
) -> Result<Json<UserProfile>, AppError> {
    let mut user = state
        .firestore
        .get_document::<UserProfile>("users", &auth.uid)
        .await?
        .ok_or(AppError::NotFound)?;

    if let Some(username) = update.username {
        let username = username.trim();
        if username.is_empty() || username.len() > 64 {
            return Err(AppError::BadRequest("invalid username".to_owned()));
        }
        user.username = username.to_owned();
    }

    if let Some(avatar) = update.avatar {
        user.avatar = Some(avatar.trim().to_owned());
    }

    if let Some(status) = update.status {
        if status.len() > 160 {
            return Err(AppError::BadRequest("status too long".to_owned()));
        }
        user.status = Some(status.trim().to_owned());
    }

    if let Some(public_key) = update.public_key {
        if public_key.trim().is_empty() {
            return Err(AppError::BadRequest("public_key cannot be empty".to_owned()));
        }
        user.public_key = public_key.trim().to_owned();
    }

    state
        .firestore
        .set_document("users", &auth.uid, &user)
        .await?;
    Ok(Json(user))
}

async fn search_users(
    State(state): State<AppState>,
    Query(query): Query<UserSearchQuery>,
) -> Result<Json<Vec<UserProfile>>, AppError> {
    let query_raw = query.query.unwrap_or_default().trim().to_owned();
    if query_raw.is_empty() {
        return Err(AppError::BadRequest("query is required".to_owned()));
    }

    let users = if query_raw.contains('@') {
        let query_string = query_raw.to_lowercase();
        state
            .firestore
            .query_equal::<UserProfile>("users", "email", &query_string, None)
            .await?
    } else {
        state
            .firestore
            .query_equal::<UserProfile>("users", "username", &query_raw, None)
            .await?
    };

    Ok(Json(users))
}
