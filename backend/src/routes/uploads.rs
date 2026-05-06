use crate::{
    auth::extractor::AuthUser,
    error::AppError,
    models::Chat,
    r2::SignedUpload,
    state::AppState,
};
use axum::{extract::State, routing::post, Json, Router};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SignedUploadRequest {
    pub chat_id: String,
    pub filename: String,
    pub content_type: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/uploads/signed-url", post(create_signed_upload))
}

async fn create_signed_upload(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<SignedUploadRequest>,
) -> Result<Json<SignedUpload>, AppError> {
    if req.chat_id.trim().is_empty() || req.filename.trim().is_empty() {
        return Err(AppError::BadRequest("chat_id and filename are required".to_owned()));
    }
    validate_content_type(&req.content_type)?;
    validate_filename(&req.filename)?;

    let chat = state
        .firestore
        .get_document::<Chat>("chats", &req.chat_id)
        .await?
        .ok_or(AppError::NotFound)?;
    if !chat.participants.iter().any(|participant| participant == &auth.uid) {
        return Err(AppError::Forbidden);
    }

    let signed = state
        .r2
        .signed_put_url(&req.chat_id, &auth.uid, &req.filename, &req.content_type)
        .await?;
    Ok(Json(signed))
}

fn validate_content_type(content_type: &str) -> Result<(), AppError> {
    let allowed_prefixes = ["image/", "video/", "audio/", "application/pdf"];
    if allowed_prefixes
        .iter()
        .any(|prefix| content_type.starts_with(prefix))
    {
        Ok(())
    } else {
        Err(AppError::BadRequest(
            "unsupported content type for upload".to_owned(),
        ))
    }
}

fn validate_filename(filename: &str) -> Result<(), AppError> {
    let trimmed = filename.trim();
    if trimmed.is_empty() || trimmed.len() > 255 {
        return Err(AppError::BadRequest("invalid filename".to_owned()));
    }
    if trimmed.chars().any(|c| c == '\n' || c == '\r' || c == '\0') {
        return Err(AppError::BadRequest("invalid filename".to_owned()));
    }
    Ok(())
}
