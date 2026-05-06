mod auth;
mod config;
mod error;
mod firebase;
mod models;
mod realtime;
mod routes;
mod state;

use axum::Router;
use config::Config;
use state::AppState;
use tower_http::{cors::{Any, CorsLayer}, set_header::SetResponseHeaderLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use axum::http::{header, Method};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "private_chat_backend=debug,tower_http=debug,axum=info".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env()?;
    let state = AppState::new(config.clone()).await?;

    let cors = if config.allowed_origins.iter().any(|origin| origin == "*") {
        CorsLayer::new().allow_origin(Any)
    } else {
        let mut cors = CorsLayer::new();
        for origin in config.allowed_origins.iter() {
            if let Ok(header_value) = origin.parse::<header::HeaderValue>() {
                cors = cors.allow_origin(header_value);
            }
        }
        cors
    }
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
    .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE])
    .allow_credentials(false);

    let app = Router::new()
        .merge(routes::health::router())
        .merge(routes::auth::router())
        .merge(routes::chats::router())
        .merge(routes::users::router())
        .merge(routes::ws::router())
        .layer(SetResponseHeaderLayer::if_not_present(header::X_CONTENT_TYPE_OPTIONS, "nosniff"))
        .layer(SetResponseHeaderLayer::if_not_present(header::X_FRAME_OPTIONS, "DENY"))
        .layer(SetResponseHeaderLayer::if_not_present(header::X_XSS_PROTECTION, "1; mode=block"))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("{}:{}", config.app_host, config.app_port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("backend listening on {addr}");
    axum::serve(listener, app).await?;
    Ok(())
}
