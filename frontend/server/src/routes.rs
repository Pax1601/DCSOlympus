use axum::extract::Path;
use axum::http::StatusCode;

use crate::theatre::Theatre;

pub async fn airbases(Path((theatre, airabse)): Path<(Theatre, String)>) -> (StatusCode, String) {
    (StatusCode::OK, ":D".to_owned())
}
