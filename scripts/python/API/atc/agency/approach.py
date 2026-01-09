from api import API
from atc.agency.airbase_agency import AirbaseAgency
from atc.agency.airbase import Airbase
import logging

class Approach(AirbaseAgency):
    def __init__(self, name, config: dict, api: API, logger: logging.Logger, kml: dict, airbase: Airbase):
        super().__init__(name, config, api, logger, kml, airbase)
        self.logger.info(f"Initializing Approach: {name}")
        
    # Get radio prompt specific to Approach
    def get_radio_prompt(self):
        return f"{self.name}, with you, vectors."
    
    # Check if a unit is under Approach's control
    def is_valid_agency(self, unit):
        # Implement logic to determine if the unit is valid for Approach control
        self.logger.info(f"Validating unit {unit.callsign} for Approach agency")
        return True  # Placeholder implementation