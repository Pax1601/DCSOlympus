use axum::{extract::Path, http::StatusCode};

pub async fn get_database(
    Path((type_folder, file_name)): Path<(String, String)>,
) -> (StatusCode, String) {
}
