use crate::config::Config;
use anyhow::{Context, Result};
use aws_config::BehaviorVersion;
use aws_credential_types::Credentials;
use aws_sdk_s3::{config::Region, presigning::PresigningConfig, Client};
use serde::Serialize;
use uuid::Uuid;

#[derive(Clone)]
pub struct R2Client {
    client: Client,
    bucket: String,
    public_base_url: String,
    signed_url_ttl: std::time::Duration,
}

#[derive(Debug, Serialize)]
pub struct SignedUpload {
    pub upload_url: String,
    pub file_url: String,
    pub object_key: String,
    pub expires_in_seconds: u64,
}

impl R2Client {
    pub async fn new(config: &Config) -> Result<Self> {
        let endpoint = format!(
            "https://{}.r2.cloudflarestorage.com",
            config.r2_account_id
        );
        let credentials = Credentials::new(
            &config.r2_access_key_id,
            &config.r2_secret_access_key,
            None,
            None,
            "env",
        );
        let sdk_config = aws_config::defaults(BehaviorVersion::latest())
            .endpoint_url(endpoint)
            .region(Region::new("auto"))
            .credentials_provider(credentials)
            .load()
            .await;

        Ok(Self {
            client: Client::new(&sdk_config),
            bucket: config.r2_bucket.clone(),
            public_base_url: config.r2_public_base_url.trim_end_matches('/').to_owned(),
            signed_url_ttl: config.r2_signed_url_ttl,
        })
    }

    pub async fn signed_put_url(
        &self,
        chat_id: &str,
        uploader_id: &str,
        filename: &str,
        content_type: &str,
    ) -> Result<SignedUpload> {
        let sanitized = filename
            .chars()
            .map(|c| {
                if c.is_ascii_alphanumeric() || ".-_".contains(c) {
                    c
                } else {
                    '_'
                }
            })
            .collect::<String>();
        let object_key = format!("chats/{chat_id}/{uploader_id}/{}-{sanitized}", Uuid::new_v4());
        let presigned = self
            .client
            .put_object()
            .bucket(&self.bucket)
            .key(&object_key)
            .content_type(content_type)
            .presigned(
                PresigningConfig::expires_in(self.signed_url_ttl)
                    .context("invalid R2 signed URL ttl")?,
            )
            .await
            .context("failed to create R2 signed URL")?;

        Ok(SignedUpload {
            upload_url: presigned.uri().to_string(),
            file_url: format!("{}/{}", self.public_base_url, object_key),
            object_key,
            expires_in_seconds: self.signed_url_ttl.as_secs(),
        })
    }
}
