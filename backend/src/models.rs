use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub uid: String,
    pub email: String,
    pub username: String,
    pub avatar: Option<String>,
    pub status: Option<String>,
    pub last_seen: DateTime<Utc>,
    pub public_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthCredential {
    pub uid: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chat {
    pub chat_id: String,
    pub participants: Vec<String>,
    pub last_message: Option<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    pub message_id: String,
    pub chat_id: String,
    pub sender_id: String,
    pub recipient_id: String,
    pub encrypted_content: String,
    pub nonce: String,
    pub media: Vec<MediaMetadata>,
    pub timestamp: DateTime<Utc>,
    pub reactions: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub file_url: String,
    pub file_type: String,
    pub file_size: u64,
    pub chat_id: String,
    pub uploader_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientWsEvent {
    JoinChat {
        chat_id: String,
    },
    SendMessage {
        chat_id: String,
        recipient_id: String,
        encrypted_content: String,
        nonce: String,
        media: Vec<MediaMetadata>,
    },
    Typing {
        chat_id: String,
        recipient_id: String,
        is_typing: bool,
    },
    Reaction {
        chat_id: String,
        message_id: String,
        emoji: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerWsEvent {
    Presence {
        user_id: String,
        online: bool,
        last_seen: DateTime<Utc>,
    },
    Message {
        message: MessageMetadata,
    },
    Typing {
        chat_id: String,
        user_id: String,
        is_typing: bool,
    },
    Reaction {
        chat_id: String,
        message_id: String,
        user_id: String,
        emoji: String,
    },
    Error {
        message: String,
    },
}
