use crate::{config::Config, firebase::FirestoreClient, realtime::ConnectionManager};
use anyhow::Result;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub firestore: FirestoreClient,
    pub connections: Arc<ConnectionManager>,
}

impl AppState {
    pub async fn new(config: Config) -> Result<Self> {
        Ok(Self {
            firestore: FirestoreClient::new(
                config.firebase_project_id.clone(),
                config.firebase_service_account_json.clone(),
            )
            .await?,
            connections: Arc::new(ConnectionManager::default()),
            config,
        })
    }
}
