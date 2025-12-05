from api import API
from atc.shared import get_new_order
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
import Levenshtein
import re
import random

# Ground-specific word corrections
word_corrections = {
    "ground": ["ground", "round", "grand", "found", "grounds"],
    "taxi": ["taxi", "tacky", "tack", "taxi"],
    "pushback": ["pushback", "push back", "pushpack", "push"],
    "startup": ["startup", "start up", "start", "started"],
    "ready": ["ready", "ready", "redy", "red"],
    "holding": ["holding", "hold", "holds", "holding short"],
    "short": ["short", "shot", "shores"],
    "runway": ["runway", "run way", "runaway"],
    "parking": ["parking", "park", "barking", "parking area"]
}

# Keywords that identify this as a ground message
ground_keywords = ["ground", "ramp"]

# Trigger words and their corresponding handlers
trigger_words = [
    (["taxi"], "handle_taxi_request"),
    (["startup"], "handle_startup_request"),
    (["radio"], "handle_radio_check_request"),
    (["ground"], "handle_ground_report"),
    (["runway", "back", "departure"], "handle_taxi_to_runway_request"),
]

CONTROL_RADIUS = 5000 

class GroundATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "bm_lewis"):
        super().__init__(airport_name, api, config, frequency, voice)
        self.tower = None

        if self.frequency is None:
            raise ValueError("Ground ATC frequency not specified in config")

    def set_tower(self, tower: ATCAgency):
        self.tower = tower

    def update(self):
        units = self.api.get_units()

        for unit in units.values():
            # Check if the unit is on the ground and within a certain distance of the runway center
            if unit.alive and unit.human and not unit.airborne:
                distance_to_runway = unit.position.distance_to(self.runway_center)
                if distance_to_runway <= CONTROL_RADIUS:
                    # Check if the unit is already under control by this agency
                    if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                        self.check_unit_position(unit)
                        continue
            
                    # Take control of the unit if it is outside of the runway box
                    if not self.check_unit_in_runway(unit):
                        self.logger.info(f"Unit {unit.ID} is within ground control radius, taking control")

                        # Recast the unit to ATCUnit to set ATC state
                        unit.__class__ = ATCUnit
                        unit.set_atc_state(ATCState.UNKNOWN)
                        unit.set_controlling_agency(self)
                        self.logger.info(f"Unit {unit.ID} is now under ground control")    

    def handle_message(self, recognised_text: str, unit: ATCUnit):
        self.logger.debug(f"Original text: '{recognised_text}'")  
        
        # Replace misheard words with correct ones using fuzzy matching
        # Split on spaces, hyphens, punctuation, and other noise characters
        text_words = re.split(r'[\s\-\.,;:!?\(\)\[\]"\']+', recognised_text)
        corrected_words = []
        
        for word in text_words:
            best_match = word
            best_ratio = 0.8  # Minimum similarity threshold
            
            # Check against all word variations for potential corrections
            for correct_word, variations in word_corrections.items():
                for variation in variations:
                    ratio = Levenshtein.ratio(word.lower(), variation.lower())
                    if ratio > best_ratio:
                        best_match = correct_word  # Replace with the correct word
                        best_ratio = ratio
            
            corrected_words.append(best_match)
        
        # Reconstruct the text with corrections
        corrected_text = " ".join(corrected_words)
        
        # Log the corrected text for debugging
        if corrected_text != recognised_text:
            self.logger.debug(f"Corrected text: '{corrected_text}'")
        
        recognised_text = corrected_text
        
        # Check if this is a ground message (needs any of the ground keywords)
        if not any(keyword in recognised_text.lower() for keyword in ground_keywords):
            return  # Not a ground message

        # Define a list of trigger words and the callback to execute if they are found
        text = None
        for words, handler_name in trigger_words:
            # Check if ALL words in the trigger are present
            if all(word in recognised_text.lower() for word in words):
                handler = getattr(self, handler_name)
                # Pass corrected_words for analysis if it's the base_ops_report handler
                if handler_name == "handle_ground_report":
                    text = handler(unit, corrected_words)
                else:
                    text = handler(unit)
                break  # Use the first match (most specific first)  

        if text:
            self._send_message_to_unit(unit, text)

    def handle_radio_check_request(self, unit: ATCUnit):
        # Respond to radio check request    
        self.logger.info(f"Responding to radio check from unit {unit.ID}")
        return f"{unit.callsign}, {self.airport_name} ground, I reed you 5 by 5."

    def handle_startup_request(self, unit: ATCUnit):
        # Send startup instructions to the unit
        self.logger.info(f"Sending startup instructions to unit {unit.ID}")
        unit.set_atc_state(ATCState.STARTING_UP)
        return f"{unit.callsign}, {self.airport_name} ground, you are cleared to start up."
    
    def handle_taxi_request(self, unit: ATCUnit):
        # Find if there are other units taxiing to the runway
        units_taxiing_to_runway: list[ATCUnit] = []
        for other_unit in self.api.get_units().values():
            if other_unit.ID != unit.ID and isinstance(other_unit, ATCUnit) and other_unit.alive and other_unit.human:
                if other_unit.get_controlling_agency() == self and other_unit.get_atc_state() == ATCState.TAXIING_TO_RUNWAY:
                    units_taxiing_to_runway.append(other_unit)

        # Order the units according to their "get_order"
        units_taxiing_to_runway.sort(key=lambda u: u.get_order())
        
        # Count the number of units taxiing to parking
        units_taxiing_to_parking = 0
        for other_unit in self.api.get_units().values():
            if other_unit.ID != unit.ID and isinstance(other_unit, ATCUnit) and other_unit.alive and other_unit.human:
                if other_unit.get_controlling_agency() == self and other_unit.get_atc_state() == ATCState.TAXIING_TO_PARKING:
                    units_taxiing_to_parking += 1

        # Send taxi instructions to the unit
        self.logger.info(f"Sending taxi instructions to unit {unit.ID}")

        text = ""
        if unit.get_atc_state() == ATCState.TAXIING_TO_PARKING:
            text = f"{unit.callsign}, {self.airport_name} ground, taxi to parking."
        else:
            unit.set_atc_state(ATCState.TAXIING_TO_RUNWAY)
            
            if len(units_taxiing_to_runway) == 1:
                text = f"{unit.callsign}, {self.airport_name} ground, taxi to and hold short runway {' '.join(self.active_runway)}, righthand."
            else:
                text = f"{unit.callsign}, {self.airport_name} ground, number {len(units_taxiing_to_runway)} taxi to and hold short runway {' '.join(self.active_runway)}, righthand, behind the {units_taxiing_to_runway[-1].name}."

        if units_taxiing_to_parking > 0:
            if units_taxiing_to_parking == 1:
                text += " Be advised, there is 1 other aircraft taxiing to parking."
            else:
                text += f" Be advised, there are {units_taxiing_to_parking} other aircraft taxiing to parking."

        # Set the unit's order in the taxi queue
        unit.set_order(get_new_order())
        return text
    
    # This allows to force the unit to taxi back to the runway to the hold short
    def handle_taxi_to_runway_request(self, unit: ATCUnit):
        # Send taxi to runway instructions to the unit
        self.logger.info(f"Sending taxi to runway instructions to unit {unit.ID}")
        unit.set_atc_state(ATCState.TAXIING_TO_RUNWAY)
        self.handle_taxi_request(unit)
        
    def check_unit_position(self, unit: ATCUnit):        
        # Check if the unit is inside the hold short box polygon
        is_inside = self.check_unit_in_hold_short_box(unit)
        
        if is_inside:
            self.logger.debug(f"Unit {unit.ID} is inside a hold short box")
            self.unit_in_hold_short_box(unit)

        # Check the unit's speed and if it's taxiing without permission, send instructions
        if unit.get_atc_state() in [ATCState.UNKNOWN, ATCState.STARTING_UP] and unit.speed > 5:
            self.logger.info(f"Unit {unit.ID} is taxiing without permission, sending instructions")
            self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} ground, if you are on this frequency hold position and request taxi clearance.")

            # Set the ground state to taxiing to runway to avoid repeated messages
            unit.set_atc_state(ATCState.TAXIING_TO_RUNWAY)

        # TODO: handle helicopters that can taxi while hovering

    def unit_in_hold_short_box(self, unit: ATCUnit):
        # If the unit is in the hold short box and has not yet started taxiing, send taxi instructions
        if unit.get_atc_state() == ATCState.TAXIING_TO_RUNWAY:
            self.logger.info(f"Unit {unit.ID} is in hold short box, switch to tower")
            if self.tower is not None:
                self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} ground, contact tower on {self._format_frequency_for_speech(self.tower.frequency)}.")
                self.tower.transfer_unit(unit)
            else:
                raise ValueError("Tower agency not set for ground ATC")

    def transfer_unit(self, unit: ATCUnit):
        # This unit has been transferred to this agency from another
        self.logger.info(f"Unit {unit.ID} has been transferred to ground ATC")
        unit.set_controlling_agency(self)
        unit.set_atc_state(ATCState.TAXIING_TO_PARKING)
            
    def handle_ground_report(self, unit: ATCUnit, corrected_words=None):
        # Analyze the corrected words to see if there's meaningful content beyond base keywords
        if corrected_words is None:
            corrected_words = []
        
        # Remove empty words, base keywords, callsign, and very short words
        callsign_words = unit.callsign.lower().split() if hasattr(unit, 'callsign') and unit.callsign else []
        exclude_words = ground_keywords + callsign_words
        
        meaningful_words = [word for word in corrected_words 
                           if word.strip() and word.lower() not in exclude_words and len(word) > 2]
        
        self.logger.info(f"Ground message from unit {unit.ID}. Corrected words: {corrected_words}")
        self.logger.info(f"Meaningful words beyond keywords: {meaningful_words}")
        
        if len(meaningful_words) == 0:
            # They said just "ground" with nothing else meaningful
            responses = [
                ", ground, go ahead.",
                ", ground, pass your message."
            ]
            response = random.choice(responses)
            self.logger.info(f"No additional content detected, prompting for more info")
        else:
            # They said base/ops plus other words we didn't understand
            responses = [
                ", ground, say again.",
                ", ground, say again last."
            ]
            response = random.choice(responses)
            self.logger.info(f"Additional unclear content detected: {' '.join(meaningful_words)}")
        
        return f"{unit.callsign}{response}"
