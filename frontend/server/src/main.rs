use std::{collections::HashMap, path::PathBuf, sync::Arc};

use anyhow::Result;
use axum::Router;
use clap::Parser;
use enum_iterator::all;
use moka::future::Cache;
use once_cell::sync::Lazy;
use tokio::fs;
use tracing::{error, info};

use crate::{airbase::Airfields, cli::Args, config::Config, theatre::Theatre};

mod airbase;
mod airfield;
mod cli;
mod config;
mod routes;
mod theatre;

pub static AIRBASES: Lazy<Arc<HashMap<Theatre, Airfields>>> =
    Lazy::new(|| Arc::new(load_airbases()));

fn load_airbases() -> HashMap<Theatre, Airfields> {
    let mut airfields = HashMap::new();

    for theatre in all::<Theatre>() {
        let Ok(json) = serde_json::from_str(theatre.airbases_json_string()) else {
            error!("Failed to parse JSON for airbase: {:?}", theatre);
            panic!("Exiting due to previous error")
        };

        airfields.insert(theatre, json);
    }

    airfields
}

type FileCache = Cache<PathBuf, String>;

#[derive(Debug, Clone)]
struct AppState {
    config_location: PathBuf,
    config: Config,
    file_cache: FileCache,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    let args = Args::parse();

    info!("Please wait while DCS Olympus Server starts up...");
    info!("Config location: {:?}", args.config);

    let config = match serde_json::from_str::<Config>(&fs::read_to_string(&args.config).await?) {
        Ok(config) => config,
        Err(err) => {
            error!("Failed to read config, aborting! Error: {:?}", err);
            panic!("Failed to read config, aborting!")
        }
    };

    let port = config.frontend.port;
    let app = Router::new()
        .nest("/api/airbases", routes::airbases::routes())
        .nest("/api/databases", routes::database::routes())
        .with_state(AppState {
            config_location: args.config,
            config: config,
            file_cache: Cache::new(100),
        });

    info!("Starting web server on port {}", port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
