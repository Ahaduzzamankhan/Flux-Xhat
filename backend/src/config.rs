use anyhow::{Context, Result};
use std::{env, path::PathBuf, time::Duration};

#[derive(Clone, Debug)]
pub struct Config {
    pub app_host: String,
    pub app_port: u16,
    pub jwt_secret: String,
    pub jwt_issuer: String,
    pub jwt_ttl_seconds: i64,
    pub firebase_project_id: String,
    pub firebase_service_account_json: PathBuf,
    pub r2_account_id: String,
    pub r2_access_key_id: String,
    pub r2_secret_access_key: String,
    pub r2_bucket: String,
    pub r2_public_base_url: String,
    pub r2_signed_url_ttl: Duration,
    pub allowed_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            app_host: env_or("APP_HOST", "0.0.0.0"),
            app_port: env_or("APP_PORT", "8080").parse().context("invalid APP_PORT")?,
            jwt_secret: require("JWT_SECRET")?,
            jwt_issuer: env_or("JWT_ISSUER", "private-chat"),
            jwt_ttl_seconds: env_or("JWT_TTL_SECONDS", "2592000")
                .parse()
                .context("invalid JWT_TTL_SECONDS")?,
            firebase_project_id: require("FIREBASE_PROJECT_ID")?,
            firebase_service_account_json: PathBuf::from(require("FIREBASE_SERVICE_ACCOUNT_JSON")?),
            r2_account_id: require("R2_ACCOUNT_ID")?,
            r2_access_key_id: require("R2_ACCESS_KEY_ID")?,
            r2_secret_access_key: require("R2_SECRET_ACCESS_KEY")?,
            r2_bucket: require("R2_BUCKET")?,
            r2_public_base_url: require("R2_PUBLIC_BASE_URL")?,
            r2_signed_url_ttl: Duration::from_secs(
                env_or("R2_SIGNED_URL_TTL_SECONDS", "900")
                    .parse()
                    .context("invalid R2_SIGNED_URL_TTL_SECONDS")?,
            ),
            allowed_origins: env_or("APP_ALLOWED_ORIGINS", "http://localhost:3000")
                .split(',')
                .map(|origin| origin.trim().to_owned())
                .filter(|origin| !origin.is_empty())
                .collect(),
        })
    }
}

fn env_or(key: &str, fallback: &str) -> String {
    env::var(key).unwrap_or_else(|_| fallback.to_owned())
}

fn require(key: &str) -> Result<String> {
    env::var(key).with_context(|| format!("missing required env var {key}"))
}

