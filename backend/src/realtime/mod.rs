use crate::models::ServerWsEvent;
use axum::extract::ws::Message;
use chrono::Utc;
use std::collections::{HashMap, HashSet};
use tokio::sync::{mpsc, RwLock};

type Tx = mpsc::UnboundedSender<Message>;

#[derive(Default)]
pub struct ConnectionManager {
    users: RwLock<HashMap<String, Tx>>,
    chat_membership: RwLock<HashMap<String, HashSet<String>>>,
}

impl ConnectionManager {
    pub async fn connect(&self, user_id: String, tx: Tx) {
        self.users.write().await.insert(user_id.clone(), tx);
        self.broadcast_presence(&user_id, true).await;
    }

    pub async fn disconnect(&self, user_id: &str) {
        self.users.write().await.remove(user_id);
        self.broadcast_presence(user_id, false).await;
    }

    pub async fn join_chat(&self, chat_id: &str, user_id: &str) {
        self.chat_membership
            .write()
            .await
            .entry(chat_id.to_owned())
            .or_default()
            .insert(user_id.to_owned());
    }

    pub async fn send_to_user(&self, user_id: &str, event: &ServerWsEvent) {
        let Ok(text) = serde_json::to_string(event) else {
            return;
        };
        if let Some(tx) = self.users.read().await.get(user_id) {
            let _ = tx.send(Message::Text(text.into()));
        }
    }

    pub async fn send_to_chat(&self, chat_id: &str, event: &ServerWsEvent) {
        let members = self
            .chat_membership
            .read()
            .await
            .get(chat_id)
            .cloned()
            .unwrap_or_default();
        for member in members {
            self.send_to_user(&member, event).await;
        }
    }

    async fn broadcast_presence(&self, user_id: &str, online: bool) {
        let event = ServerWsEvent::Presence {
            user_id: user_id.to_owned(),
            online,
            last_seen: Utc::now(),
        };
        let users = self.users.read().await.keys().cloned().collect::<Vec<_>>();
        for recipient in users {
            if recipient != user_id {
                self.send_to_user(&recipient, &event).await;
            }
        }
    }
}
