import random
from api import Unit
from atc.agency.agency import Agency
from atc.agency.base import Base
from atc.agency.ground import Ground
from atc.agency.tower import Tower
from atc.agency.approach import Approach
from atc.agency.radar import Radar
from atc.utils import spell_frequency, spell_number
from atc.constants import * 
import time
from atc.constants import READBACK_TIMEOUT_SECONDS, READBACK_CANCEL_TIMEOUT_SECONDS
from atc.agency.airbase import Airbase

class ATCUnit(Unit):
    # Initialize additional properties for ATCUnit
    def initialize(self):
        self.radars: list[Radar] = []
        self.controlling_agency = None

        self.waiting_for_readback = False
        self.agency_waiting_for_readback = None
        self.waiting_for_readback_epoch = 0
        self.asked_if_copied_readback = False

        self.cleared_for_takeoff = False
        self.cleared_to_land = False
        self.going_around = False

        self.keep_checking_takeoff_clearance = False
        self.keep_checking_landing_clearance = False

    # Set the list of radars for this ATC unit
    def set_radars(self, radars: list[Radar]):
        self.radars = radars

    # Update method called periodically
    def update(self):
        # Readback handling ############################################################
        # If we are waiting for a readback, check for timeout
        if self.waiting_for_readback:
            if time.time() - self.waiting_for_readback_epoch > READBACK_TIMEOUT_SECONDS and not self.asked_if_copied_readback:
                # Ask the unit if they copied the readback
                if self.agency_waiting_for_readback is not None:
                    self.agency_waiting_for_readback.transmit_message(f"{self.callsign}, did you copy my last message?")
                    self.asked_if_copied_readback = True
            if time.time() - self.waiting_for_readback_epoch > READBACK_TIMEOUT_SECONDS + READBACK_CANCEL_TIMEOUT_SECONDS:
                if self.agency_waiting_for_readback is not None:
                    self.agency_waiting_for_readback.transmit_message(f"{self.callsign}, cancelling readback request. Proceed own navigation.")
                # Cancel the readback wait
                self.waiting_for_readback = False
                self.agency_waiting_for_readback = None
                self.asked_if_copied_readback = False

        # Flags reset handling ########################################################
        # If we are no longer alive reset all flags
        if not self.alive:
            self.cleared_for_takeoff = False
            self.cleared_to_land = False
            self.going_around = False
            self.keep_checking_takeoff_clearance = False
            self.keep_checking_landing_clearance = False
            return
        
        # If we are airborne, clear takeoff clearance
        if self.airborne and self.cleared_for_takeoff:
            self.cleared_for_takeoff = False
            self.keep_checking_takeoff_clearance = False

        # If we are on the ground, clear landing clearance and going around status
        if not self.airborne:
            self.cleared_to_land = False
            self.going_around = False
            self.keep_checking_landing_clearance = False
            
        # If we are cleared to land, on runway axis, and past the runway center, we are going around
        if self.cleared_to_land and self.controlling_agency is not None:
            airbase = self.controlling_agency.get_airbase()
            runway = airbase.get_active_runway()
            if runway.check_on_runway_axis(self) and runway.check_past_runway_center(self):
                self.going_around = True
                self.cleared_to_land = False
                self.keep_checking_landing_clearance = False
                
        # If we are going around, on runway axis, and past the opposite threshold, reset going around status
        if self.going_around and self.controlling_agency is not None:
            airbase = self.controlling_agency.get_airbase()
            runway = airbase.get_active_runway()
            if runway.check_on_runway_axis(self) and runway.check_past_runway_end(self):
                self.going_around = False
                
        # If the controlling agency is not Tower, clear takeoff, landing, and going around statuses
        if not isinstance(self.controlling_agency, Tower):
            self.cleared_for_takeoff = False
            self.cleared_to_land = False
            self.going_around = False
            self.keep_checking_takeoff_clearance = False
            self.keep_checking_landing_clearance = False
            
        # Takeoff clearance checking ####################################################
        if self.keep_checking_takeoff_clearance and isinstance(self.controlling_agency, Tower):
            tower: Tower = self.controlling_agency
            departure_message, cleared, keep_checking = tower.check_takeoff_clearance(self)
            if cleared:
                self.cleared_for_takeoff = True
                self.keep_checking_takeoff_clearance = False
                self.controlling_agency.transmit_message(f"{self.callsign}, Tower. {departure_message}")
                # Create a readback callback to confirm takeoff clearance
                self.wait_for_readback(tower, lambda readback: self.handle_tower_takeoff_readback(tower, readback))
            else:
                self.keep_checking_takeoff_clearance = keep_checking
                
        # Landing clearance checking ####################################################
        if self.keep_checking_landing_clearance and isinstance(self.controlling_agency, Tower):
            tower: Tower = self.controlling_agency
            landing_message, cleared, keep_checking, go_around = tower.check_landing_clearance(self)
            if cleared:
                self.cleared_to_land = True
                self.keep_checking_landing_clearance = False
                self.controlling_agency.transmit_message(f"{self.callsign}, Tower. {landing_message}")
                # Create a readback callback to confirm landing clearance
                self.wait_for_readback(tower, lambda readback: self.handle_tower_landing_readback(tower, readback))
            else:
                self.keep_checking_landing_clearance = keep_checking         
                
        # Go around checking ##########################################################
        if self.cleared_to_land and not self.going_around and isinstance(self.controlling_agency, Tower):
            go_around = self.controlling_agency.check_go_around(self)
            if go_around:
                self.going_around = True
                self.cleared_to_land = False
                self.keep_checking_landing_clearance = False
                self.controlling_agency.transmit_message(f"{self.callsign}, Tower. Go around.")
                
    # Handle an incoming message from an agency
    def handle_message(self, agency: Agency, message: str):
        # First, check if the agency is correct. If not, inform the unit
        if not agency.is_valid_agency(self):
            # Check if we can figure out the correct agency
            valid_agency = self.get_valid_controlling_agency()
            if valid_agency is not None:
                agency.transmit_message(f"{self.callsign}, {agency.name}, you are not under my control. Contact {valid_agency.name} on {spell_frequency(valid_agency.listener.frequency)} MHz.")
            else:
                agency.transmit_message(f"{self.callsign}, {agency.name}, you are not under my control. Proceed own navigation.")
            return
        
        # Check if this agency is waiting for a readback
        if self.waiting_for_readback and agency == self.agency_waiting_for_readback:
            # We are waiting for a readback
            # Call the readback callback to perform a special action
            if self.readback_callback is not None:
                good_readback = self.readback_callback(message)

                # If we got a good readback, clear the wait state, else reset the timeout
                if good_readback:
                    self.waiting_for_readback = False
                    self.agency_waiting_for_readback = None
                    self.readback_callback = None
                else:
                    self.waiting_for_readback_epoch = time.time()  # Reset the timeout
                    self.asked_if_copied_readback = False
            return
        else: 
            # Switch depending on the agency type
            if isinstance(agency, Base):
                self.handle_base_message(agency, message)
            elif isinstance(agency, Ground):
                self.handle_ground_message(agency, message)
            elif isinstance(agency, Tower):
                self.handle_tower_message(agency, message)
            elif isinstance(agency, Approach):
                self.handle_approach_message(agency, message)
            elif isinstance(agency, Radar):
                self.handle_radar_message(agency, message)

        # Assign the controlling agency
        self.controlling_agency = agency

    # Determine the valid controlling agency for this unit
    def get_valid_controlling_agency(self) -> Agency | None:
        # Iterate over all the radars
        for radar in self.radars:
            # Iterate over all the airbases under that radar
            for airbase in radar.get_airbases():
                # Check each agency in order, from smaller to bigger: Ground, Tower, Approach
                for agency in [airbase.ground, airbase.tower, airbase.approach]:
                    if isinstance(agency, Agency) and agency.is_valid_agency(self):
                        return agency
        return None
    
    # Wait for a readback from the unit, with a callback to handle the readback
    def wait_for_readback(self, agency: Agency, callback):
        self.waiting_for_readback = True
        self.agency_waiting_for_readback = agency
        self.readback_callback = callback
        self.waiting_for_readback_epoch = time.time()
        
    def get_cleared_for_takeoff(self) -> bool:
        return self.cleared_for_takeoff
    
    def get_cleared_to_land(self) -> bool:
        return self.cleared_to_land
    
    def get_going_around(self) -> bool:
        return self.going_around

    ##################################################################
    # Messages to BASE Agency
    ##################################################################
    def handle_base_message(self, agency: Base, message: str):
        # Check if this is the first contact with Base
        message_out = ""
        if agency != self.controlling_agency:
            message_out = f"{self.callsign}, Base, good day sir."
        else:
            message_out = f"{self.callsign}, Base."

        intent = agency.get_probable_intent(message)
        if intent is not None:
            if intent == "with you":
                pass
            elif intent == "out":
                message_out += f" {random.choice(random_out_responses)}"
            elif intent == "in" or intent == "in and up":
                message_out += f" {random.choice(random_in_and_up_responses)}"
            elif intent == "in and down":
                message_out += f" {random.choice(random_in_and_down_responses)}"
            elif intent == "radio check":
                message_out += " Loud and clear. How do you read me?"
                self.wait_for_readback(agency, lambda readback: self.handle_base_radio_check_readback(agency, readback))
            elif intent == "good readability":
                message_out += " Copy, thank you."
            elif intent == "bad readability":
                message_out += " Understood, check your radio."
            elif intent == "frequencies":
                # TODO Add ATIS frequency if available
                message_out += f" The frequencies for {agency.get_airbase().name} are:"
                if agency.get_airbase().tower is not None:
                    message_out += f" Tower {spell_frequency(agency.get_airbase().tower.listener.frequency)} MHz,"
                if agency.get_airbase().ground is not None:
                    message_out += f" Ground {spell_frequency(agency.get_airbase().ground.listener.frequency)} MHz,"
                if agency.get_airbase().approach is not None:
                    message_out += f" Approach {spell_frequency(agency.get_airbase().approach.listener.frequency)} MHz."
        else:
            message_out += " Say again."
        agency.transmit_message(message_out)

    # Handle the readback for a radio check from Base
    def handle_base_radio_check_readback(self, agency: Base, message: str):
        good_readback = False
        message_out = f"{self.callsign}, Base."
        
        intent = agency.get_probable_intent(message)
        if intent is not None:
            if intent == "good readability":
                message_out += " Copy, thank you."
                good_readback = True
            elif intent == "bad readability":
                message_out += " Understood, check your radio."
                good_readback = False
            else:
                message_out += " Say again."
        else:
            message_out += " Say again."
        agency.transmit_message(message_out)
        return good_readback

    ##################################################################
    # Messages to GROUND Agency
    ##################################################################
    def handle_ground_message(self, agency: Ground, message: str):
        message_out = ""

        # Get the airbase associated with this Ground agency
        airbase = agency.get_airbase()

        if agency != self.controlling_agency:
            message_out = f"{self.callsign}, Ground, good day."

            # This was the first contact. Did the unit mention the current weather condition?
            weather_letter = airbase.get_weather_letter().lower()
            if not weather_letter in message:
                # They did not mention the letter or we could not understand it. Request confirmation they have the current weather.
                message_out += f" Confirm you have information {weather_letter} on board."
                self.wait_for_readback(agency, lambda readback: self.handle_ground_weather_readback(agency, airbase, readback))
                agency.transmit_message(message_out)
                return
        else:
            message_out = f"{self.callsign}, Ground."

        active_runway = airbase.get_active_runway()
        intent = agency.get_probable_intent(message)
        if intent is not None:
            if intent == "information":
                message_out += f" Copy, go with your request."
            elif intent == "startup clearance":
                message_out += " Clear to start. Advise when ready to taxi."
            elif intent == "taxi clearance":
                message_out += f" Clear to taxi. Hold short of runway {active_runway.spell_name()}."
            elif intent == "taxi to parking":
                message_out += " Taxi to parking at own discretion."
            elif intent == "runway in use":
                # Get the active runway from the airbase
                message_out += f" Runway {active_runway.spell_name()} in use."
        else:
            message_out += " Say again."
        agency.transmit_message(message_out)

    # Handle the readback for weather confirmation from Ground
    def handle_ground_weather_readback(self, agency: Ground, airbase: Airbase, message: str):
        good_readback = False
        message_out = f"{self.callsign}, Ground."

        weather_letter = airbase.get_weather_letter()
        intent = agency.get_probable_intent(message)
        if intent is not None:
            if intent == "affirmative":
                message_out += " Copy, thank you. Go with your request."
                good_readback = True
            elif intent == "negative":
                message_out += f" Advise when you have information {weather_letter} on board." # TODO add ATIS frequency
                good_readback = True
            else:
                message_out += " Say again."
        else:
            message_out += " Say again."
        agency.transmit_message(message_out)
        return good_readback

    ##################################################################
    # Messages to TOWER Agency
    ##################################################################
    def handle_tower_message(self, agency: Tower, message: str):
        message_out = ""

        # Get the airbase associated with this Tower agency
        airbase = agency.get_airbase()

        if agency != self.controlling_agency:
            message_out = f"{self.callsign}, Tower, good day."
        else:
            message_out = f"{self.callsign}, Tower."

        active_runway = airbase.get_active_runway()
        intent = agency.get_probable_intent(message)
        if intent is not None:
            if intent == "departure":
                departure_message, cleared, keep_checking = agency.check_takeoff_clearance(self)
                message_out += f" {departure_message}"

                # If cleared, set the cleared for takeoff status
                if cleared:
                    self.cleared_for_takeoff = True
                    # Create a readback callback to confirm takeoff clearance
                    self.wait_for_readback(agency, lambda readback: self.handle_tower_takeoff_readback(agency, readback))

                # If we need to keep checking, set a check flag. We will periodically check if the unit is now eligible for takeoff clearance
                if keep_checking:
                    self.keep_checking_takeoff_clearance = True
            elif intent == "land" or intent == "abeam" or intent == "final":
                landing_message, cleared, keep_checking, go_around = agency.check_landing_clearance(self)
                message_out += f" {landing_message}"

                # If cleared, set the cleared to land status
                if cleared:
                    self.cleared_to_land = True
                    # Create a readback callback to confirm landing clearance
                    self.wait_for_readback(agency, lambda readback: self.handle_tower_landing_readback(agency, readback))

                # If we need to keep checking, set a check flag. We will periodically check if the unit is now eligible for landing clearance
                if keep_checking:
                    self.keep_checking_landing_clearance = True
                    
                # If we need to go around, set the going around status
                if go_around:
                    self.going_around = True
            elif intent == "go around":
                message_out += " Copy, go around."
                self.going_around = True
                self.cleared_to_land = False
                self.keep_checking_landing_clearance = False
            elif intent == "stay in the pattern":
                message_out += f" Copy, stay on this frequency and enter {active_runway.get_pattern_direction()} downwind for runway {active_runway.spell_name()}. Report on downwind."
            elif intent == "initials":
                if active_runway.get_pattern_direction() == "left":
                    message_out += f" Copy, clear to break runway {active_runway.spell_name()}. Report on downwind."
                else:
                    message_out += f" Copy, clear to break runway {active_runway.spell_name()}, righthand. Report on downwind."
            elif intent == "downwind":
                message_out += f" Copy, report abeam."  
        else:
            message_out += " Say again."
        agency.transmit_message(message_out)

    # Handle the readback for a takeoff clearance from Tower
    def handle_tower_takeoff_readback(self, agency: Tower, message: str):
        good_readback = False
        message_out = f"{self.callsign}, Tower."

        intent = agency.get_probable_intent(message)
        if intent is not None:
            if intent == "cleared for takeoff":
                # Nothing else to do, it was a good readback
                good_readback = True
            else:
                message_out += " Negative."
                departure_message, _, _ = agency.check_takeoff_clearance(self)
                message_out += f" {departure_message}"
                agency.transmit_message(message_out)
        else:
            message_out += " Say again."
            agency.transmit_message(message_out)
        return good_readback
    
    # Handle the readback for landing clearance from Tower
    def handle_tower_landing_readback(self, agency: Tower, message: str):
        good_readback = False
        message_out = f"{self.callsign}, Tower."

        intent = agency.get_probable_intent(message)
        if intent is not None:
            if intent == "cleared to land":
                # Nothing else to do, it was a good readback
                good_readback = True
            else:
                message_out += " Negative."
                landing_message, _, _, _ = agency.check_landing_clearance(self)
                message_out += f" {landing_message}"
                agency.transmit_message(message_out)
        else:
            message_out += " Say again."
            agency.transmit_message(message_out)
        return good_readback

    ##################################################################
    # Messages to APPROACH Agency
    ##################################################################
    def handle_approach_message(self, agency: Approach, message: str):
        agency.transmit_message(f"{self.callsign}, Approach received your message: {message}. No further action implemented.")

    ##################################################################
    # Messages to RADAR Agency
    ##################################################################
    def handle_radar_message(self, agency: Radar, message: str):
        agency.transmit_message(f"{self.callsign}, Radar received your message: {message}. No further action implemented.")