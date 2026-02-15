use std::collections::HashMap;

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub backend: ConfigBackend,
    pub frontend: ConfigFrontend,
    pub audio: ConfigAudio,
    // TODO(timm): Not sure from the olympus.json what this can be
    // controllers: Vec<_>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConfigBackend {
    pub address: String,
    pub port: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConfigAuthentication {
    #[serde(rename = "gameMasterPassword")]
    pub game_master_password: String,
    #[serde(rename = "blueCommanderPassword")]
    pub blue_commander_password: String,
    #[serde(rename = "redCommanderPassword")]
    pub red_commander_password: String,
    #[serde(rename = "adminPassword")]
    pub admin_password: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConfigFrontend {
    pub port: u16,
    #[serde(rename = "customAuthHeaders")]
    pub custom_auth_headers: CustomAuthHeaders,
    #[serde(rename = "elevationProvider")]
    pub elevation_provider: ElevationProvider,
    #[serde(rename = "mapLayers")]
    pub map_layers: HashMap<String, MapLayerProvider>,
    #[serde(rename = "mapMirrors")]
    pub map_mirrors: HashMap<String, String>,
    #[serde(rename = "autoconnectWhenLocal")]
    pub autoconnect_when_local: bool,
    #[serde(rename = "proxyHeader")]
    pub proxy_header: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CustomAuthHeaders {
    pub enabled: bool,
    pub username: String,
    pub group: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ElevationProvider {
    pub provider: String,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MapLayerProvider {
    #[serde(rename = "urlTemplate")]
    pub url_template: String,
    #[serde(rename = "minZoom")]
    pub min_zoom: i32,
    #[serde(rename = "maxZoom")]
    pub max_zoom: i32,
    pub attribution: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConfigAudio {
    #[serde(rename = "SRSPort")]
    pub srs_port: u16,
    #[serde(rename = "WSPort")]
    pub ws_port: u16,
    #[serde(rename = "WSEndpoint")]
    pub ws_endpoint: String,
}
