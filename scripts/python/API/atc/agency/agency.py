from api import API
from atc.atc_unit import ATCUnit
import logging

class Agency:
    def __init__(self, name: str, config: dict, api: API, logger: logging.Logger):
        self.name = name
        self.api = api
        self.logger = logger
        
        # Create a listener for SRS communications on the given frequency
        self.listener = self.api.create_radio_listener() # Convert MHz to Hz
        self.listener.start(frequency=config.get("frequency") * 1e6)        
        self.listener.register_message_callback(self.handle_message)
        self.logger.info(f"Agency {name} initialized on frequency {config.get('frequency')} MHz")
        
        # Initialize the listener with the prompt and enable calling callsign prepending
        self.listener.set_prompt(self.get_radio_prompt())
        self.listener.set_prepend_calling_callsign(True)
        
    # Handle incoming messages from units
    def handle_message(self, recognized_text: str, unit_id: str):
        self.logger.info(f"Agency {self.name} received message from {unit_id}: {recognized_text}")
        
        # Find the unit by its ID
        units = self.api.get_units()
        if unit_id in units:
            unit = units[unit_id]
            self.logger.info(f"Message from unit {unit.callsign}")
            
            # If the unit is an ATCUnit, call its handle_message method
            if isinstance(unit, ATCUnit):
                unit.handle_message(self, recognized_text)
        
    # Get radio prompt specific to the agency. This should be overridden by subclasses.
    def get_radio_prompt(self) -> str:
        return ""