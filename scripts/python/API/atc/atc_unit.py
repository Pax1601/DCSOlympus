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
from enum import Enum
import time
from atc.constants import READBACK_TIMEOUT_SECONDS, READBACK_CANCEL_TIMEOUT_SECONDS
from atc.agency.airbase import Airbase

class ATCUnitState(Enum):
    IDLE = 0

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

        # If we are airborne, clear takeoff clearance
        if self.airborne and self.cleared_for_takeoff:
            self.cleared_for_takeoff = False
            self.keep_checking_takeoff_clearance = False

        # If we are on the ground, clear landing clearance and going around status
        if not self.airborne:
            self.cleared_to_land = False
            self.going_around = False
            self.keep_checking_landing_clearance = False
                
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

                # If we need to keep checking, set a check flag
                if keep_checking:
                    self.keep_checking_takeoff_clearance = True
        else:
            message_out += " Say again."
        agency.transmit_message(message_out)

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