use axum::Json;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use crate::theatre::Theatre;

pub async fn show_airbases() -> (StatusCode, String) {
    (StatusCode::OK, Theatre::error_message())
}

/// Url that takes Theatre and Airbase name
pub async fn airbases(Path((theatre, airbase)): Path<(String, String)>) -> Response {
    let Ok(theatre) = serde_json::from_str::<Theatre>(&theatre) else {
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
