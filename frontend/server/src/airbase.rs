use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Airfields {
    pub airfields: HashMap<String, Airfield>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Airfield {
    #[serde(rename = "ICAO")]
    pub icao: String,
    pub elevation: String,
    #[serde(rename = "TACAN")]
    pub tacan: String,
    pub runways: Vec<Runway>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Runway {
    pub headings: Vec<HashMap<String, HeadingEntry>>,
    pub length: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadingEntry {
    #[serde(rename = "magHeading")]
    pub mag_heading: String,
    #[serde(rename = "ILS")]
    pub ils: String,
}
