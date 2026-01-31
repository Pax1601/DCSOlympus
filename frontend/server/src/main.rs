use std::{collections::HashMap, sync::Arc};

use anyhow::Result;
use axum::{Router, routing::get};
use enum_iterator::all;
use once_cell::sync::Lazy;
use tracing::{error, info};

use crate::{airbase::Airfields, theatre::Theatre};

mod airbase;
mod airfield;
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

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let app = Router::new().route("/{theatre}/{airbase}", get(routes::airbases));

    info!("Starting web server on port 3000");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
