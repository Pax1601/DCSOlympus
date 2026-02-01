use std::path::PathBuf;

use clap::Parser;

/// Web server for Olympus
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    /// olympus.json config location
    #[arg(short, long)]
    pub config: PathBuf,

    /// Proxy requests to vite server for development
    #[arg(short, long, default_value_t = false)]
    pub vite: bool,
}
