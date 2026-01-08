from api import API
from atc.agency.agency import Agency
from atc.agency.airbase import Airbase
import logging

class Radar(Agency):
    def __init__(self, name: str, config: dict, api: API, logger: logging.Logger):
        super().__init__(name, config, api, logger)
        self.airbases = self.initialize_airbases(config.get("airbases", {}))
        
    # Initialize airbases from configuration
    def initialize_airbases(self, airbases_config: dict):
        airbases = []
        for airbase_name, airbase_config in airbases_config.items():
            airbase = Airbase(airbase_name, airbase_config, self.api, self.logger)
            airbases.append(airbase)
        return airbases
    
    # Get the list of airbases 
    def get_airbases(self):
        return self.airbases
    
    # Get radio prompt specific to Radar
    def get_radio_prompt(self):
        return "Radar, with you."
