use std::path::PathBuf;

use anyhow::{Result, bail};
use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    routing::get,
};
use tokio::fs;
use tracing::error;

use crate::{AppState, FileCache};

pub fn routes() -> Router<AppState> {
    Router::new().route("/{type_folder}/{file_name}", get(get_database))
}

async fn read_and_cache_file(cache: &FileCache, wanted_file: &PathBuf) -> Result<()> {
    let content = match fs::read_to_string(&wanted_file).await {
        Ok(origin_content) => {
            cache.insert(wanted_file.clone(), origin_content).await;
        }
        Err(error) => {
            bail!(
                "Failed to read origin content from {:?}: {}",
                wanted_file,
                error
            );
        }
    };

    Ok(content)
}

pub async fn get_database(
    Path((type_folder, file_name)): Path<(String, String)>,
    State(state): State<AppState>,
) -> (StatusCode, String) {
    let db_location = state
        .config_location
        // Go one up for folder location
        .parent()
        .unwrap()
        .join("..")
        .join("Mods")
        .join("Services")
        .join("Olympus")
        .join("databases");
    let wanted_file = db_location.join(type_folder).join(file_name);

    if !db_location.exists() {
        error!(
            "db folder not present at expected location: {:?}",
            db_location
        );

        return (
            StatusCode::FORBIDDEN,
            "db folder not present at expected location".to_owned(),
        );
    }

    if !wanted_file.starts_with(db_location) {
        error!("Requested file not in db location: {:?}", wanted_file);

        return (
            StatusCode::FORBIDDEN,
            "Requested file not in db location".to_owned(),
        );
    }

    // Load db file contents into cache, if not present
    if state.file_cache.contains_key(&wanted_file) {
        // Store the updated at time in the cache for each file,
        // and get the current one. If different, re-cache, otherwise, let it rip.
        // ref: https://users.rust-lang.org/t/how-compare-dates-between-folder-creation-and-time-now/97721/3
        /*
        fs::metadata(&wanted_file)
            .await
            .unwrap()
            .modified()
            .unwrap()
            */
    } else {
        if let Err(error) = read_and_cache_file(&state.file_cache, &wanted_file).await {
            error!("{}", error);

            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to load db file".to_owned(),
            );
        }
    }

    // Get the cached file content and return it if found
    match state.file_cache.get(&wanted_file).await {
        Some(content) => (StatusCode::OK, content),
        None => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "db file contents not in cache".to_owned(),
            );
        }
    }
}
