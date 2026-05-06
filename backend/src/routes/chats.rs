use crate::{
    auth::extractor::AuthUser,
    error::AppError,
    models::{Chat, MessageMetadata, UserProfile},
    state::AppState,
};
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateChatRequest {
    pub recipient_id: String,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/chats", get(list_chats).post(create_chat))
        .route("/chats/{chat_id}", get(get_chat))
        .route("/chats/{chat_id}/messages", get(list_messages))
}

async fn create_chat(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateChatRequest>,
) -> Result<Json<Chat>, AppError> {
    if req.recipient_id == auth.uid {
        return Err(AppError::BadRequest("cannot chat with yourself".to_owned()));
    }
    state
        .firestore
        .get_document::<UserProfile>("users", &req.recipient_id)
        .await?
        .ok_or(AppError::NotFound)?;

    let participants = sorted_pair(&auth.uid, &req.recipient_id);
    let chat_id = chat_id_for(&participants[0], &participants[1]);
    let chat = Chat {
        chat_id: chat_id.clone(),
        participants,
        last_message: None,
        updated_at: Utc::now(),
    };
    state.firestore.set_document("chats", &chat_id, &chat).await?;
    Ok(Json(chat))
}

async fn list_chats(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<Chat>>, AppError> {
    let chats = state
        .firestore
        .query_array_contains::<Chat>(
            "chats",
            "participants",
            &auth.uid,
            Some(("updated_at", "DESCENDING")),
        )
        .await?;
    Ok(Json(chats))
}

async fn get_chat(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(chat_id): Path<String>,
) -> Result<Json<Chat>, AppError> {
    let chat = state
        .firestore
        .get_document::<Chat>("chats", &chat_id)
        .await?
        .ok_or(AppError::NotFound)?;
    require_participant(&chat, &auth.uid)?;
    Ok(Json(chat))
}

async fn list_messages(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(chat_id): Path<String>,
) -> Result<Json<Vec<MessageMetadata>>, AppError> {
    let chat = state
        .firestore
        .get_document::<Chat>("chats", &chat_id)
        .await?
        .ok_or(AppError::NotFound)?;
    require_participant(&chat, &auth.uid)?;

    let messages = state
        .firestore
        .query_equal::<MessageMetadata>(
            "messages",
            "chat_id",
            &chat_id,
            Some(("timestamp", "ASCENDING")),
        )
        .await?;
    Ok(Json(messages))
}

fn require_participant(chat: &Chat, uid: &str) -> Result<(), AppError> {
    if chat.participants.iter().any(|participant| participant == uid) {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

fn sorted_pair(a: &str, b: &str) -> Vec<String> {
    let mut pair = vec![a.to_owned(), b.to_owned()];
    pair.sort();
    pair.dedup();
    pair
}

fn chat_id_for(a: &str, b: &str) -> String {
    format!("direct_{}_{}", a, b)
}
