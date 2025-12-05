from api import API
from atc.shared import get_new_order
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

DISTANCE_THRESHOLD = 3000  # in meters
ALTITUDE_THRESHOLD = 200  # in meters

class TowerATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "am_adam"):
        super().__init__(airport_name, api, config, frequency, voice)
        self.ground = None
        self.approach = None
        
        if self.frequency is None:
            raise ValueError("Tower ATC frequency not specified in config")
        
        # Get ATZ data from config
        atz = self.config.get("atz", {})
        
        # Get ATZ coordinates
        self.atz_coordinates = atz.get("coordinates", [])
        if not self.atz_coordinates:
            self.logger.warning(f"No ATZ coordinates defined for {airport_name}, using default control radius")
            self.use_polygon_control = False
            self.control_radius = 10 * 1852  # 10 NM in meters as fallback
        else:
            self.use_polygon_control = True
        
        # Get vertical limits from ATZ data
        vertical = atz.get("vertical", {})
        if vertical:
            # Parse lower limit
            lower = vertical.get("lower", "SFC")
            if lower == "SFC" or lower == "sfc":
                self.control_altitude_lower = 0.0
            else:
                # Assume it's in feet
                self.control_altitude_lower = float(lower) * 0.3048  # Convert feet to meters
            
            # Parse upper limit
            upper = vertical.get("upper", 5000)
            if isinstance(upper, str) and (upper.upper() == "SFC"):
                self.control_altitude_upper = 0.0
            else:
                # Assume it's in feet
                self.control_altitude_upper = float(upper) * 0.3048  # Convert feet to meters
        else:
            self.logger.warning(f"No vertical limits defined for {airport_name}, using defaults")
            self.control_altitude_lower = 0.0
            self.control_altitude_upper = 5000 * 0.3048  # 5000 feet in meters

    def set_ground(self, ground: ATCAgency):
        self.ground = ground

    def set_approach(self, approach: ATCAgency):
        self.approach = approach
    
    def check_unit_in_atz(self, unit) -> bool:
        """Check if unit is within the ATZ (tower control zone)."""
        if self.use_polygon_control:
            # Check if unit is inside ATZ polygon
            return self._point_in_polygon(unit.position.lat, unit.position.lng, self.atz_coordinates)
        else:
            # Fallback to radius-based control
            distance_to_runway = unit.position.distance_to(self.runway_center)
            return distance_to_runway <= self.control_radius
    
    def check_unit_altitude_in_control(self, unit) -> bool:
        """Check if unit altitude is within tower control limits."""
        altitude_agl = unit.position.alt - self.runway_elevation
        return self.control_altitude_lower <= altitude_agl <= self.control_altitude_upper

    def update(self):
        units = self.api.get_units()

        for unit in units.values():
            # Check if the unit is airborne or on the runway
            if unit.alive and unit.human:
                if unit.airborne:
                    # Check if unit is within ATZ and altitude limits
                    in_atz = self.check_unit_in_atz(unit)
                    in_altitude = self.check_unit_altitude_in_control(unit)
                    
                    if in_atz and in_altitude:
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
                            # If the unit is outside of control area, release it
                            self.logger.info(f"Releasing unit {unit.ID} from tower control")
                            # Send a message to the unit
                            self._send_message_to_unit(unit, f"{unit.callsign}, monitor {self._format_frequency_for_speech(Unicom.frequency)}.")
                            unit.set_controlling_agency(Unicom)
                else:
                    if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                        self.check_unit_position(unit)
                        continue

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
                    raise ValueError("Ground agency not set for tower ATC")
                return
            
            # Force the unit to be under tower control if they are airborne within the ATZ and altitude limits and they are contacting us
            if unit.airborne and self.check_unit_altitude_in_control(unit) and self.check_unit_in_atz(unit):
                # If unit is airborne and within tower control area, take control
                self.logger.info(f"Unit {unit.ID} is within tower control area, taking control")
                unit.__class__ = ATCUnit
                unit.set_atc_state(ATCState.ARRIVING)
                unit.set_controlling_agency(self)

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
                    raise ValueError("Ground agency not set for tower ATC")
        # Unit is airborne
        else:
            if unit.get_atc_state() == ATCState.TAKING_OFF:
                # If the unit is airborne and in takeoff state, set to departing
                self.logger.info(f"Unit {unit.ID} is airborne after takeoff")
                unit.set_atc_state(ATCState.DEPARTING)
            elif unit.get_atc_state() == ATCState.DEPARTING:
                # Check if unit has left the ATZ or altitude control zone
                in_atz = self.check_unit_in_atz(unit)
                in_altitude = self.check_unit_altitude_in_control(unit)
                
                if not in_atz or not in_altitude:
                    # If the unit is airborne and in departure state, transfer to radar ATC if available
                    if self.approach:
                        self.logger.info(f"Transferring unit {unit.ID} to departure ATC")
                        unit.set_controlling_agency(self.approach)
                        self.approach.transfer_unit(unit)

                        # Notify the unit
                        self._send_message_to_unit(unit, f"{unit.callsign}, contact departure on {self._format_frequency_for_speech(self.approach.frequency)}.")
                    else:
                        self.logger.warning(f"Departure ATC not set, cannot transfer unit {unit.ID}")
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
            unit.set_order(get_new_order())
            return f"{unit.callsign}, {self.airport_name} tower, hold short of runway {' '.join(self.active_runway)}. You are number {len(self._get_list_of_units_in_takeoff_order())} for departure."
            
        self.logger.info(f"Clearing unit {unit.ID} for takeoff")
        unit.set_atc_state(ATCState.TAKING_OFF)

        # Transfer to departure ATC if available
        if self.approach:
            self.approach.transfer_unit(unit)
        else:
            raise ValueError("Approach agency not set for tower ATC")

        return f"{unit.callsign}, {self.airport_name} tower, runway {' '.join(self.active_runway)} cleared for takeoff, push departure on {self._format_frequency_for_speech(self.approach.frequency)}."

    def handle_landing_request(self, unit: ATCUnit):
        # Check that the unit is in the arriving state before clearing to land
        if unit.get_atc_state() != ATCState.ARRIVING:
            self.logger.info(f"Unit {unit.ID} not in arriving state, ask again")
            return f"{unit.callsign}, {self.airport_name} tower, say again."

        # Tell the unit to continue, will clear when close to runway
        self.logger.info(f"Clearing unit {unit.ID} to continue approach")
        return f"{unit.callsign}, {self.airport_name} tower, copy, continue."

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
        takeoff_units = [u for u in units.values() if isinstance(u, ATCUnit) and u.get_controlling_agency() == self and (u.get_atc_state() == ATCState.WAITING_FOR_TAKEOFF or u.get_atc_state() == ATCState.TAKING_OFF) and u.alive]
        
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

        