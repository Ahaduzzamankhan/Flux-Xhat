use crate::{config::Config, error::AppError};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub iss: String,
    pub exp: usize,
    pub iat: usize,
}

pub fn create_token(config: &Config, uid: &str, email: &str) -> Result<String, AppError> {
    let now = Utc::now();
    let claims = Claims {
        sub: uid.to_owned(),
        email: email.to_owned(),
        iss: config.jwt_issuer.clone(),
        iat: now.timestamp() as usize,
        exp: (now + Duration::seconds(config.jwt_ttl_seconds)).timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )
    .map_err(|err| AppError::Anyhow(err.into()))
}

pub fn verify_token(config: &Config, token: &str) -> Result<Claims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&[config.jwt_issuer.as_str()]);
    validation.validate_exp = true;
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.jwt_secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized)
}

