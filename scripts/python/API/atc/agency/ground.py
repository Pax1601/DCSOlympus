from api import API
from atc.agency.agency import Agency
import logging

class Ground(Agency):
    def __init__(self, name, config: dict, api: API, logger: logging.Logger):
        super().__init__(name, config, api, logger)
        
        self.logger.info(f"Initializing Ground: {name}")
        
    # Get radio prompt specific to Ground
    def get_radio_prompt(self):
        return "Ground, runway, startup, taxi, clearance, ready, hold short."
    
        
        