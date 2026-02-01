use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};

use crate::theatre::Theatre;

pub fn routes() -> Router {
    Router::new()
        .route("/", get(index_thearte))
        .route("/{theatre}", get(show_airbases))
        .route("/{theatre}/{airbase}", get(show_airbase))
}

async fn index_thearte() -> (StatusCode, String) {
    (StatusCode::OK, Theatre::error_message())
}

async fn show_airbases(Path(theatre): Path<String>) -> Response {
    let theatre = match serde_json::from_str::<Theatre>(&format!("\"{}\"", theatre)) {
        Ok(theatre) => theatre,
        Err(error) => {
            dbg!(error);
            return (StatusCode::NOT_FOUND, Theatre::error_message()).into_response();
        }
    };

    (StatusCode::OK, Json(theatre.airbases_json().airfields)).into_response()
}

/// Url that takes Theatre and Airbase name
async fn show_airbase(Path((theatre, airbase)): Path<(String, String)>) -> Response {
    let Ok(theatre) = serde_json::from_str::<Theatre>(&format!("\"{}\"", theatre)) else {
        return (StatusCode::NOT_FOUND, Theatre::error_message()).into_response();
    };
    let airbases = theatre.airbases_json();

    let Some(airfield) = airbases.airfields.get(&airbase).cloned() else {
        let all_airfields = airbases
            .airfields
            .keys()
            .map(|s| s.as_str())
            .collect::<Vec<_>>()
            .join("\n\t");
        let body = format!(
            "Unknown airbase name \"{}\".  Available options are:\n\t{}",
            airbase, all_airfields
        );

        return (StatusCode::NOT_FOUND, body).into_response();
    };

    (StatusCode::OK, Json(airfield)).into_response()
}
