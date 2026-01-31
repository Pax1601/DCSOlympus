use enum_iterator::Sequence;
use tracing::error;

use crate::{AIRBASES, airbase::Airfields};

#[derive(Debug, Clone, Sequence, Eq, PartialEq, Hash)]
pub enum Theatre {
    Caucasus,
    Falklands,
    Marianas,
    Nevada,
    Normandy,
    PersianGulf,
    Sinaimap,
    Syria,
    TheChannel,
    Kola,
}

impl ToString for Theatre {
    fn to_string(&self) -> String {
        match self {
            Theatre::Caucasus => "caucasus".to_string(),
            Theatre::Falklands => "falklands".to_string(),
            Theatre::Kola => "kola".to_string(),
            Theatre::Marianas => "marianas".to_string(),
            Theatre::Nevada => "nevada".to_string(),
            Theatre::Normandy => "normandy".to_string(),
            Theatre::PersianGulf => "persiangulf".to_string(),
            Theatre::Sinaimap => "sinaimap".to_string(),
            Theatre::Syria => "syria".to_string(),
            Theatre::TheChannel => "thechannel".to_string(),
        }
    }
}

impl Theatre {
    pub fn airbases_json_string(&self) -> &str {
        match self {
            Theatre::Caucasus => include_str!("..\\databases\\airbases\\caucasus.json"),
            Theatre::Falklands => include_str!("..\\databases\\airbases\\falklands.json"),
            Theatre::Kola => include_str!("..\\databases\\airbases\\kola.json"),
            Theatre::Marianas => include_str!("..\\databases\\airbases\\marianas.json"),
            Theatre::Nevada => include_str!("..\\databases\\airbases\\nevada.json"),
            Theatre::Normandy => include_str!("..\\databases\\airbases\\normandy.json"),
            Theatre::PersianGulf => include_str!("..\\databases\\airbases\\persiangulf.json"),
            Theatre::Sinaimap => include_str!("..\\databases\\airbases\\sinaimap.json"),
            Theatre::Syria => include_str!("..\\databases\\airbases\\syria.json"),
            Theatre::TheChannel => include_str!("..\\databases\\airbases\\thechannel.json"),
        }
    }

    pub fn airbases_json(&self) -> Airfields {
        match AIRBASES.get(self) {
            Some(airfields) => airfields.clone(),
            None => {
                error!("Failed to load airfields for {:?}", self);
                panic!("Exiting due to previous error")
            }
        }
    }
}
