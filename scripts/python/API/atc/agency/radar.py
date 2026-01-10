from api import API
from atc.agency.agency import Agency
from atc.agency.airbase import Airbase
import logging

class Radar(Agency):
    def __init__(self, name: str, config: dict, api: API, logger: logging.Logger, kml: dict):
        super().__init__(name, config, api, logger)
        self.kml = kml
        self.airbases: list[Airbase] = []
        
        self.logger.info(f"Initializing Radar: {name} with {len(self.airbases)} airbases")
        self.initialize_airbases(config.get("airbases", {}))
        
    # Initialize airbases from configuration
    def initialize_airbases(self, airbases_config: dict):
        for airbase_name, airbase_config in airbases_config.items():
            airbase_kml = self.kml.get(airbase_name, {})

            # Warn if no KML data found for this airbase
            if not airbase_kml:
                self.logger.warning(f"No KML data found for airbase: {airbase_name}")

            # Create the Airbase instance
            airbase = Airbase(airbase_name, airbase_config, self.api, self.logger, airbase_kml)
            self.airbases.append(airbase)
    
    # Get the list of airbases 
    def get_airbases(self):
        return self.airbases
    
    # Get radio prompt specific to Radar
    def get_radio_prompt(self):
        return f"{self.name}, with you."
    
    # Check if a unit is under Radar's control
    def is_valid_agency(self, unit):
        # Implement logic to determine if the unit is valid for Radar control
        self.logger.info(f"Validating unit {unit.callsign} for Radar agency")
        return True  # Placeholder implementation
    
    # Update the radar and all its airbases
    def update(self):
        for airbase in self.airbases:
            airbase.update()
