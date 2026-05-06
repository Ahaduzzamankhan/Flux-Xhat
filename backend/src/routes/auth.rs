use crate::{
    auth::{extractor::AuthUser, jwt, password},
    error::AppError,
    models::{AuthCredential, UserProfile},
    state::AppState,
};
use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub username: String,
    pub public_key: String,
    pub avatar: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserProfile,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/me", get(me))
}

async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let email = normalize_email(&req.email)?;
    if req.password.len() < 12 {
        return Err(AppError::BadRequest(
            "password must be at least 12 characters".to_owned(),
        ));
    }
    if req.public_key.trim().is_empty() {
        return Err(AppError::BadRequest("public_key is required".to_owned()));
    }

    let credential_id = email_doc_id(&email);
    if state
        .firestore
        .get_document::<AuthCredential>("auth_credentials", &credential_id)
        .await?
        .is_some()
    {
        return Err(AppError::BadRequest("email is already registered".to_owned()));
    }

    let uid = Uuid::new_v4().to_string();
    let now = Utc::now();
    let user = UserProfile {
        uid: uid.clone(),
        email: email.clone(),
        username: req.username.trim().to_owned(),
        avatar: req.avatar,
        status: Some("Hey there, I use Private Chat.".to_owned()),
        last_seen: now,
        public_key: req.public_key,
    };
    let credential = AuthCredential {
        uid: uid.clone(),
        email: email.clone(),
        password_hash: password::hash_password(&req.password)?,
        created_at: now,
    };

    state
        .firestore
        .create_document("users", &uid, &user)
        .await?;
    state
        .firestore
        .create_document("auth_credentials", &credential_id, &credential)
        .await?;

    let token = jwt::create_token(&state.config, &uid, &email)?;
    Ok(Json(AuthResponse { token, user }))
}

async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let email = normalize_email(&req.email)?;
    let credential = state
        .firestore
        .get_document::<AuthCredential>("auth_credentials", &email_doc_id(&email))
        .await?
        .ok_or(AppError::Unauthorized)?;

    if !password::verify_password(&req.password, &credential.password_hash) {
        return Err(AppError::Unauthorized);
    }

    let user = state
        .firestore
        .get_document::<UserProfile>("users", &credential.uid)
        .await?
        .ok_or(AppError::Unauthorized)?;
    let token = jwt::create_token(&state.config, &credential.uid, &email)?;
    Ok(Json(AuthResponse { token, user }))
}

async fn me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<UserProfile>, AppError> {
    let user = state
        .firestore
        .get_document::<UserProfile>("users", &auth.uid)
        .await?
        .ok_or(AppError::Unauthorized)?;
    Ok(Json(user))
}

fn normalize_email(email: &str) -> Result<String, AppError> {
    let email = email.trim().to_ascii_lowercase();
    if !email.contains('@') || email.len() > 320 {
        return Err(AppError::BadRequest("invalid email".to_owned()));
    }
    Ok(email)
}

fn email_doc_id(email: &str) -> String {
    URL_SAFE_NO_PAD.encode(email.as_bytes())
}
