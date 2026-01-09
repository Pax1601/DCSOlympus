from api import API
from atc.agency.airbase_agency import AirbaseAgency
from atc.agency.airbase import Airbase
import logging
    
class Base(AirbaseAgency):    
    def __init__(self, name, config: dict, api: API, logger: logging.Logger, kml: dict, airbase: Airbase):
        super().__init__(name, config, api, logger, kml, airbase)
        self.logger.info(f"Initializing Base: {name}")

    # Get the predefined sentences for Base
    def get_sentences(self):
        return {
                "out": ["out"],
                "in": ["in"],
                "in and up": ["in and up"],
                "in and down": ["in and down"],
                "radio check": ["radio check", "do you read me", "can you hear me"],
                "good readability": ["loud and clear", "you are loud and clear", "I read you loud and clear", "five by five"], 
                "bad readability": ["I can't hear you well", "you are breaking up", "your signal is weak"]
        }
        
    # Get radio prompt specific to Base
    def get_radio_prompt(self):
        return f"{self.name}, in, out, up, down, ops, radio check, five by five, read me, loud and clear."
    
    # Check if a unit is under Base's control
    def is_valid_agency(self, unit):
        # Implement logic to determine if the unit is valid for Base control
        self.logger.info(f"Validating unit {unit.callsign} for Base agency")
        return True # Base is always there for us <3
    
    
    

    
        
        