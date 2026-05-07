use crate::{
    auth::jwt,
    error::AppError,
    models::{Chat, ClientWsEvent, MessageMetadata, ServerWsEvent, UserProfile},
    state::AppState,
};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::{HeaderMap, header},
    response::Response,
    routing::get,
    Router,
};
use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use std::collections::HashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct WsAuth {
    token: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/ws", get(ws_handler))
}

async fn ws_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<Option<WsAuth>>,
    ws: WebSocketUpgrade,
) -> Result<Response, AppError> {
    let token = extract_bearer_token(&headers)
        .or_else(|| query.map(|query| query.token))
        .ok_or(AppError::Unauthorized)?;
    let claims = jwt::verify_token(&state.config, &token)?;
    Ok(ws.on_upgrade(move |socket| handle_socket(state, claims.sub, socket)))
}

fn extract_bearer_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "))
        .map(|token| token.to_owned())
}

async fn handle_socket(state: AppState, user_id: String, socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    state.connections.connect(user_id.clone(), tx).await;

    let write_task = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            if sender.send(message).await.is_err() {
                break;
            }
        }
    });

    while let Some(Ok(message)) = receiver.next().await {
        match message {
            Message::Text(text) => {
                if let Err(err) = handle_event(&state, &user_id, &text).await {
                    state
                        .connections
                        .send_to_user(
                            &user_id,
                            &ServerWsEvent::Error {
                                message: err.to_string(),
                            },
                        )
                        .await;
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    state.connections.disconnect(&user_id).await;
    if let Ok(Some(mut user)) = state
        .firestore
        .get_document::<UserProfile>("users", &user_id)
        .await
    {
        user.last_seen = Utc::now();
        let _ = state.firestore.set_document("users", &user_id, &user).await;
    }
    write_task.abort();
}

async fn handle_event(state: &AppState, user_id: &str, text: &str) -> Result<(), AppError> {
    let event: ClientWsEvent =
        serde_json::from_str(text).map_err(|err| AppError::BadRequest(err.to_string()))?;

    match event {
        ClientWsEvent::JoinChat { chat_id } => {
            require_chat_participant(state, user_id, &chat_id).await?;
            state.connections.join_chat(&chat_id, user_id).await;
        }
        ClientWsEvent::SendMessage {
            chat_id,
            recipient_id,
            encrypted_content,
            nonce,
            media,
        } => {
            let chat = require_chat_participant(state, user_id, &chat_id).await?;
            if !chat
                .participants
                .iter()
                .any(|participant| participant == &recipient_id)
            {
                return Err(AppError::Forbidden);
            }
            let now = Utc::now();
            let message = MessageMetadata {
                message_id: Uuid::new_v4().to_string(),
                chat_id: chat_id.clone(),
                sender_id: user_id.to_owned(),
                recipient_id: recipient_id.clone(),
                encrypted_content,
                nonce,
                media,
                timestamp: now,
                reactions: HashMap::new(),
            };
            state
                .firestore
                .create_document("messages", &message.message_id, &message)
                .await?;

            let chat = Chat {
                chat_id: chat_id.clone(),
                participants: sorted_pair(user_id, &recipient_id),
                last_message: Some(message.message_id.clone()),
                updated_at: now,
            };
            state
                .firestore
                .set_document("chats", &chat_id, &chat)
                .await?;

            let outbound = ServerWsEvent::Message { message };
            state.connections.send_to_user(&recipient_id, &outbound).await;
            state.connections.send_to_user(user_id, &outbound).await;
        }
        ClientWsEvent::Typing {
            chat_id,
            recipient_id,
            is_typing,
        } => {
            let chat = require_chat_participant(state, user_id, &chat_id).await?;
            if !chat
                .participants
                .iter()
                .any(|participant| participant == &recipient_id)
            {
                return Err(AppError::Forbidden);
            }
            state
                .connections
                .send_to_user(
                    &recipient_id,
                    &ServerWsEvent::Typing {
                        chat_id,
                        user_id: user_id.to_owned(),
                        is_typing,
                    },
                )
                .await;
        }
        ClientWsEvent::Reaction {
            chat_id,
            message_id,
            emoji,
        } => {
            require_chat_participant(state, user_id, &chat_id).await?;
            if let Some(mut message) = state
                .firestore
                .get_document::<MessageMetadata>("messages", &message_id)
                .await?
            {
                if message.chat_id != chat_id {
                    return Err(AppError::Forbidden);
                }
                let users = message.reactions.entry(emoji.clone()).or_default();
                if users.iter().any(|existing| existing == user_id) {
                    users.retain(|existing| existing != user_id);
                } else {
                    users.push(user_id.to_owned());
                }
                state
                    .firestore
                    .set_document("messages", &message_id, &message)
                    .await?;
            } else {
                return Err(AppError::NotFound);
            }
            let event = ServerWsEvent::Reaction {
                chat_id,
                message_id,
                user_id: user_id.to_owned(),
                emoji,
            };
            if let ServerWsEvent::Reaction { chat_id, .. } = &event {
                state.connections.send_to_chat(chat_id, &event).await;
            }
        }
    }
    Ok(())
}

async fn require_chat_participant(
    state: &AppState,
    user_id: &str,
    chat_id: &str,
) -> Result<Chat, AppError> {
    let chat = state
        .firestore
        .get_document::<Chat>("chats", chat_id)
        .await?
        .ok_or(AppError::NotFound)?;
    if chat.participants.iter().any(|participant| participant == user_id) {
        Ok(chat)
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
