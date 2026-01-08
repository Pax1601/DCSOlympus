from api import API
from atc.agency.agency import Agency
import logging

class Tower(Agency):
    def __init__(self, name, config: dict, api: API, logger: logging.Logger):
        super().__init__(name, config, api, logger)
        
        self.logger.info(f"Initializing Tower: {name}")
        
    # Get radio prompt specific to Tower
    def get_radio_prompt(self):
        return "Tower, runway, ready, departure, land, abeam, downwind."
    
        
        