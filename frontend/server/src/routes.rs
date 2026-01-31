use axum::Json;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use crate::theatre::Theatre;

pub async fn airbases(Path((theatre, airbase)): Path<(Theatre, String)>) -> Response {
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
