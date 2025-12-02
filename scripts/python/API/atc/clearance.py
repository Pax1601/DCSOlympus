from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
import random
import Levenshtein
import re


# Keywords that identify this as a clearance delivery message
clearance_keywords = ["clearance", "delivery"]

class ClearanceDeliveryATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "am_adam"):
        super().__init__(airport_name, api, config, frequency, voice)
        self.ground = None
        
        if self.frequency is None:
            raise ValueError("Clearance Delivery ATC frequency not specified in config")

    def set_ground(self, ground: ATCAgency):
        self.ground = ground

    def update(self):
        # Clearance delivery doesn't need to monitor unit positions
        pass

    def handle_message(self, recognised_text: str, unit: ATCUnit):
        print(f"[CLEARANCE] Original text: '{recognised_text}'")  
        
        # Check if this is a clearance delivery message
        if not any(keyword in recognised_text.lower() for keyword in clearance_keywords):
            return  # Not a clearance message

        # Always respond that clearance delivery is not manned
        if self.ground:
            response = f"{unit.callsign}, clearance delivery is none operational, V F R flight only, contact ground on {self._format_frequency_for_speech(self.ground.frequency)} for taxi instructions."
        else:
            response = f"{unit.callsign}, clearance delivery is none operational, V F R flight only, contact ground for taxi instructions."
        
        self.logger.info(f"Redirecting unit {unit.ID} from clearance delivery to ground control")
        self._send_message_to_unit(unit, response)