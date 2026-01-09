from sentence_transformers import SentenceTransformer
from api import API
from atc.agency.airbase_agency import AirbaseAgency
from atc.agency.airbase import Airbase
import logging

class Ground(AirbaseAgency):    
    def __init__(self, name, config: dict, api: API, logger: logging.Logger, kml: dict, airbase: Airbase):
        super().__init__(name, config, api, logger, kml, airbase)
        self.logger.info(f"Initializing Ground: {name}")
        
    # Get the predefined sentences for Ground
    def get_sentences(self):
        return {
                "information": ["with information on board"],
                "startup clearance": ["Request startup clearance."],
                "taxi clearance": ["Request taxi clearance."],
                "runway in use": ["Request runway in use."],
                "affirmative": ["Affirmative."],
                "negative": ["Negative."],
        }
    
    # Get radio prompt specific to Ground
    def get_radio_prompt(self):
        return f"{self.name}, runway, startup, taxi, clearance, ready, hold short, affirmative, negative."
    
    # Check if a unit is under Ground's control
    def is_valid_agency(self, unit):
        # Implement logic to determine if the unit is valid for Ground control
        self.logger.info(f"Validating unit {unit.callsign} for Ground agency")
        
        # Simple check: is the unit on the ground?
        is_on_ground = not unit.airborne

        return is_on_ground
    
        
        