use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
struct Health {
    ok: bool,
    service: &'static str,
}

pub fn router<S>() -> Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    Router::new().route(
        "/health",
        get(|| async {
            Json(Health {
                ok: true,
                service: "private-chat-backend",
            })
        }),
    )
}

