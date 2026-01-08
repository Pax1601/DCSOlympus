from api import API
from atc.agency.agency import Agency
import logging

class Approach(Agency):
    def __init__(self, name, config: dict, api: API, logger: logging.Logger):
        super().__init__(name, config, api, logger)
        
        self.logger.info(f"Initializing Approach: {name}")
        
    # Get radio prompt specific to Approach
    def get_radio_prompt(self):
        return "Approach, with you, vectors."
    
        
        