from api import API
from atc.agency.agency import Agency
import logging

class Base(Agency):
    def __init__(self, name, config: dict, api: API, logger: logging.Logger):
        super().__init__(name, config, api, logger)
        
        self.logger.info(f"Initializing Base: {name}")
        
    # Get radio prompt specific to Base
    def get_radio_prompt(self):
        return "Base, in, out, up, down, ops."
    
        
        