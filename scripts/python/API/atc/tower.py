from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
import Levenshtein
import re
import random

# Tower-specific word corrections
word_corrections = {
    "tower": ["tower", "power", "hour", "tauer", "towers"],
    "abeam": ["a bean","bean","abeam","a beam","been"],
    "land": ["landing", "land","lander"],
    "initials": ["initial"],
    "go around": ["around", "ground", "round", "grand", "a round"],
    "departure": ["departure", "depart", "departs"],
    "final": ["final", "finals", "fine"],
    "approach": ["approach", "approch", "approaches"]
}

# Keywords that identify this as a tower message
tower_keywords = ["tower", "control"]

# Trigger words and their corresponding handlers
trigger_words = [
    (["land","abeam","final"], "handle_landing_request"),
    (["departure"], "handle_takeoff_request"),
    (["initials"], "handle_break_request"),
    (["go around"], "handle_go_around_request"),
    (["tower"], "handle_tower_report")
]


CONTROL_RADIUS = 10 * 1852  # 10 nautical miles in meters
CONTROL_ALTITUDE = 5000 * 0.3048  # 5000 feet in meters
DISTANCE_THRESHOLD = 3000  # in meters
ALTITUDE_THRESHOLD = 200  # in meters

MAX_ORDER = 0

class TowerATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "am_adam"):
        super().__init__(airport_name, api, config, frequency, voice)
        self.ground = None
        self.radar = None
        
        if self.frequency is None:
            raise ValueError("Tower ATC frequency not specified in config")

    def set_ground(self, ground: ATCAgency):
        self.ground = ground

    def set_radar(self, radar: ATCAgency):
        self.radar = radar

    def update(self):
        units = self.api.get_units()

        for unit in units.values():
            # Check if the unit is airborne or on the runway
            if unit.alive and unit.human:
                distance_to_runway = unit.position.distance_to(self.runway_center)
                if unit.airborne:
                    if distance_to_runway <= CONTROL_RADIUS and (unit.position.alt - self.runway_elevation <= CONTROL_ALTITUDE):
                        # Check if the unit is already under control by this agency
                        if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                            self.check_unit_position(unit)
                            continue
                        
                        # If the unit is controlled by another agency, skip it, unless it is Unicom
                        if isinstance(unit, ATCUnit) and unit.get_controlling_agency() != self and unit.get_controlling_agency() != Unicom:
                            continue

                        # Take control of the unit
                        # Recast the unit to ATCUnit to set ATC state
                        unit.__class__ = ATCUnit
                        unit.set_atc_state(ATCState.ARRIVING) # Default to arriving state because it means it is arriving from another location
                        unit.set_controlling_agency(self)
                        self.logger.info(f"Unit {unit.ID} is now under tower control")
                    else:
                        if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                            # If the unit is outside of control radius, release it
                            self.logger.info(f"Releasing unit {unit.ID} from tower control")
                            # Send a message to the unit
                            self._send_message_to_unit(unit, f"{unit.callsign}, monitor {self._format_frequency_for_speech(Unicom.frequency)}.")
                            unit.set_controlling_agency(Unicom)
                else:
                    if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                        self.check_unit_position(unit)
                        continue

    def handle_message(self, recognised_text: str, unit: ATCUnit):
        print(f"[TOWER] Original text: '{recognised_text}'")  
        
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
        
        # Print the corrected text for debugging
        if corrected_text != recognised_text:
            print(f"[TOWER] Corrected text: '{corrected_text}'")
        
        recognised_text = corrected_text
        
        # Check if this is a tower message (needs any of the tower keywords)
        if not any(keyword in recognised_text.lower() for keyword in tower_keywords):
            return  # Not a tower message

        # Check if unit should be talking to tower (not at parking/taxi areas)
        # Tower only handles units at the runway or airborne, or already under tower control
        if unit.get_controlling_agency() != self:
            # If unit is on ground and not at runway, they should talk to ground first
            if not unit.airborne and not self.check_unit_in_runway(unit) and not self.check_unit_in_hold_short_box(unit):
                # Redirect to ground control
                if self.ground:
                    self._send_message_to_unit(unit, f"{unit.callsign}, contact ground on {self._format_frequency_for_speech(self.ground.frequency)} for taxi clearance.")
                else:
                    self._send_message_to_unit(unit, f"{unit.callsign}, contact ground control for taxi clearance.")
                return

        # Define a list of trigger words and the callback to execute if they are found
        text = None
        for words, handler_name in trigger_words:
            # Check if any words in the trigger are present
            if any(word in recognised_text.lower() for word in words):
                handler = getattr(self, handler_name)
                # Pass corrected_words for analysis if it's the base_ops_report handler
                if handler_name == "handle_tower_report":
                    text = handler(unit, corrected_words)
                else:
                    text = handler(unit)
                break  # Use the first match (most specific first)  
        if text:
            self._send_message_to_unit(unit, text)

    def check_unit_position(self, unit: ATCUnit):
        # If the unit is on the ground
        if not unit.airborne:
            if unit.get_atc_state() == ATCState.WAITING_FOR_TAKEOFF:
                # Check that the runway is clear or that the occupying unit is this one
                if self.check_runway_clear(unit) and self._get_last_in_takeoff_order() == unit:
                    # Check that this unit is next in line for takeoff
                    if self._get_list_of_units_in_takeoff_order()[0] == unit:
                        self.logger.info(f"Clearing unit {unit.ID} for takeoff")
                        self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} tower, runway {' '.join(self.active_runway)}, right hand, wind 2 2 niner at 6 knots, runway {' '.join(self.active_runway)}, cleared for takeoff.")
                        unit.set_atc_state(ATCState.TAKING_OFF)

            # If outside of the runway, and in landing state, transfer to ground ATC
            if not self.check_unit_in_runway(unit) and not self.check_unit_in_hold_short_box(unit) and not unit.airborne:
                if self.ground:
                    self.logger.info(f"Transferring unit {unit.ID} to ground ATC")
                    unit.set_controlling_agency(self.ground)
                    self.ground.transfer_unit(unit)

                    # Notify the unit
                    self._send_message_to_unit(unit, f"{unit.callsign}, contact ground on {self._format_frequency_for_speech(self.ground.frequency)}.")
                else:
                    self.logger.warning(f"Ground ATC not set, cannot transfer unit {unit.ID}")
                    unit.set_controlling_agency(Unicom)

                    # Notify the unit
                    self._send_message_to_unit(unit, f"{unit.callsign}, taxi at own discretion and monitor {self._format_frequency_for_speech(Unicom.frequency)}.")
        # Unit is airborne
        else:
            if unit.get_atc_state() == ATCState.TAKING_OFF:
                # If the unit is airborne and in takeoff state, set to departing
                self.logger.info(f"Unit {unit.ID} is airborne after takeoff")
                unit.set_atc_state(ATCState.DEPARTING)
            elif unit.get_atc_state() == ATCState.DEPARTING and (unit.position.distance_to(self.runway_center) > CONTROL_RADIUS or unit.position.alt - self.runway_elevation > CONTROL_ALTITUDE):
                # If the unit is airborne and in departure state, transfer to radar ATC if available
                if self.radar:
                    self.logger.info(f"Transferring unit {unit.ID} to radar ATC")
                    unit.set_controlling_agency(self.radar)
                    self.radar.transfer_unit(unit)

                    # Notify the unit
                    self._send_message_to_unit(unit, f"{unit.callsign}, contact departure on {self._format_frequency_for_speech(self.radar.frequency)}.")
                else:
                    self.logger.warning(f"Radar ATC not set, cannot transfer unit {unit.ID}")
                    unit.set_controlling_agency(Unicom)

                    # Notify the unit
                    self._send_message_to_unit(unit, f"{unit.callsign}, proceed on course and monitor {self._format_frequency_for_speech(Unicom.frequency)}.")
            elif unit.get_atc_state() == ATCState.ARRIVING:
                if unit.position.distance_to(self.runway_center) < DISTANCE_THRESHOLD and unit.position.alt - self.runway_elevation < ALTITUDE_THRESHOLD:
                    if self.check_runway_clear(unit):
                        self.logger.info(f"Clearing unit {unit.ID} for landing")
                        self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} tower, wind 2 2 niner at 6 knots, runway {' '.join(self.active_runway)}, cleared to land.")
                        unit.set_atc_state(ATCState.LANDING)
                    else:
                        self.logger.info(f"Runway not clear for unit {unit.ID} landing")
                        self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} tower, go around.")
                        unit.set_atc_state(ATCState.GOING_AROUND)
            elif unit.get_atc_state() == ATCState.GOING_AROUND:
                if unit.position.distance_to(self.runway_center) > DISTANCE_THRESHOLD or unit.position.alt - self.runway_elevation > ALTITUDE_THRESHOLD:
                    # If the unit is going around and climbed above thresholds, set to arriving again
                    self.logger.info(f"Unit {unit.ID} going around, setting to arriving")
                    unit.set_atc_state(ATCState.ARRIVING)
            elif unit.get_atc_state() == ATCState.LANDING:
                # Check if someone else is on the runway
                if not self.check_runway_clear(unit):
                    self.logger.info(f"Runway occupied, unit {unit.ID} cannot land yet")
                    self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} tower, go around.")
                    unit.set_atc_state(ATCState.GOING_AROUND)

    def handle_takeoff_request(self, unit: ATCUnit):
        # Check if the runway is clear
        if not self.check_runway_clear(unit) or self._get_last_in_takeoff_order() not in [None, unit]:
            self.logger.info(f"Runway not clear for unit {unit.ID} takeoff request")
            unit.set_atc_state(ATCState.WAITING_FOR_TAKEOFF)
            global MAX_ORDER
            MAX_ORDER += 1
            unit.set_order(MAX_ORDER)
            return f"{unit.callsign}, {self.airport_name} tower, hold short of runway {' '.join(self.active_runway)}. You are number {len(self._get_list_of_units_in_takeoff_order()) + 1} for departure."
            
        self.logger.info(f"Clearing unit {unit.ID} for takeoff")
        unit.set_atc_state(ATCState.TAKING_OFF)
        return f"{unit.callsign}, {self.airport_name} tower, runway {' '.join(self.active_runway)} cleared for takeoff."

    def handle_landing_request(self, unit: ATCUnit):
        # Check if the runway is clear
        if not self.check_runway_clear(unit):
            self.logger.info(f"Runway not clear for unit {unit.ID} landing request")
            return f"{unit.callsign}, {self.airport_name} tower, continue."
        
        self.logger.info(f"Clearing unit {unit.ID} for landing")
        unit.set_atc_state(ATCState.LANDING)
        return f"{unit.callsign}, {self.airport_name} tower, wind 2 2 niner at 6 knots, runway {' '.join(self.active_runway)} cleared to land, recheck gear."

    def handle_break_request(self, unit: ATCUnit):
        self.logger.info(f"Clearing unit {unit.ID} for overhead break")
        unit.set_atc_state(ATCState.ARRIVING)
        return f"{unit.callsign}, {self.airport_name} tower, cleared into the break {' '.join(self.active_runway)}, righthand."
    
    def handle_go_around_request(self, unit: ATCUnit):
        self.logger.info(f"Unit {unit.ID} going around")
        unit.set_atc_state(ATCState.GOING_AROUND)
        return f"{unit.callsign}, {self.airport_name} tower, go around rejoin pattern, contact me at initial again."

    def handle_tower_report(self, unit: ATCUnit, corrected_words=None):
        # Analyze the corrected words to see if there's meaningful content beyond base keywords
        if corrected_words is None:
            corrected_words = []
        
        # Remove empty words, base keywords, callsign, and very short words
        callsign_words = unit.callsign.lower().split() if hasattr(unit, 'callsign') and unit.callsign else []
        exclude_words = tower_keywords + callsign_words
        
        meaningful_words = [word for word in corrected_words 
                           if word.strip() and word.lower() not in exclude_words and len(word) > 2]
        
        self.logger.info(f"Tower message from unit {unit.ID}. Corrected words: {corrected_words}")
        self.logger.info(f"Meaningful words beyond keywords: {meaningful_words}")
        
        if len(meaningful_words) == 0:
            # They said just "base" or "ops" with nothing else meaningful
            responses = [
                ", tower, go ahead.",
                ", tower, pass your message."
            ]
            response = random.choice(responses)
            self.logger.info(f"No additional content detected, prompting for more info")
        else:
            # They said base/ops plus other words we didn't understand
            responses = [
                ", tower, say again.",
                ", tower, say again last.",
                ", tower, didn't copy, say again."
            ]
            response = random.choice(responses)
            self.logger.info(f"Additional unclear content detected: {' '.join(meaningful_words)}")
        
        return f"{unit.callsign}{response}"

    def transfer_unit(self, unit: ATCUnit):
        # This unit has been transferred to this agency from another
        self.logger.info(f"Unit {unit.ID} has been transferred to tower ATC")
        unit.set_controlling_agency(self)

    def _get_list_of_units_in_takeoff_order(self):
        # Get a list of units in takeoff order
        units = self.api.get_units()
        takeoff_units = [u for u in units.values() if isinstance(u, ATCUnit) and u.get_controlling_agency() == self and (u.get_atc_state() == ATCState.WAITING_FOR_TAKEOFF or u.get_atc_state() == ATCState.TAKING_OFF)]
        
        if not takeoff_units:
            return []
        
        # Sort by order
        takeoff_units.sort(key=lambda u: u.get_order())
        return takeoff_units

    def _get_last_in_takeoff_order(self):
        takeoff_units = self._get_list_of_units_in_takeoff_order()
        if not takeoff_units:
            return None
        return takeoff_units[-1]

        