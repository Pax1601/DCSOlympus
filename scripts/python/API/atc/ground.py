from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
from atc.tower import ALTITUDE_THRESHOLD, DISTANCE_THRESHOLD

CONTROL_RADIUS = 5000

class GroundATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float):
        super().__init__(airport_name, api, config, frequency)
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
                    
                    # If the unit is controlled by another agency, skip it
                    if isinstance(unit, ATCUnit) and unit.get_controlling_agency() != self:
                        continue

                    # Take control of the unit
                    # Recast the unit to ATCUnit to set ATC state
                    unit.__class__ = ATCUnit
                    unit.set_atc_state(ATCState.UNKNOWN)
                    unit.set_controlling_agency(self)
                    self.logger.info(f"Unit {unit.ID} is now under ground control")    


    def handle_message(self, recognized_text: str, unit: ATCUnit):
        if "ground" not in recognized_text.lower():
            return  # Not a ground message

        # Define a list of trigger words and the callback to execute if they are found
        trigger_words = [
            (["radio", "check"], self.handle_radio_check_request),
            (["engine", "start"], self.handle_startup_request),
            (["taxi", "to runway"], self.handle_taxi_request),
        ]

        text = None
        for words, callback in trigger_words:
            if any(word in recognized_text.lower() for word in words):
                text = callback(unit)     
                break  

        if text:
            self._send_message_to_unit(unit, text)

    def handle_radio_check_request(self, unit: ATCUnit):
        # Respond to radio check request    
        self.logger.info(f"Responding to radio check from unit {unit.ID}")
        return f"{unit.callsign}, {self.airport_name} ground, I read you 5 by 5."

    def handle_startup_request(self, unit: ATCUnit):
        # Send startup instructions to the unit
        self.logger.info(f"Sending startup instructions to unit {unit.ID}")
        unit.set_atc_state(ATCState.STARTING_UP)
        return f"{unit.callsign}, {self.airport_name} ground, you are cleared to start up."
    
    def handle_taxi_request(self, unit: ATCUnit):
        # Find if there are other units taxiing to the runway
        units_taxiing_to_runway = 1
        last_unit = None
        for other_unit in self.api.get_units().values():
            if other_unit.ID != unit.ID and isinstance(other_unit, ATCUnit) and other_unit.alive and other_unit.human:
                if other_unit.get_controlling_agency() == self and other_unit.get_atc_state() == ATCState.TAXIING_TO_RUNWAY:
                    units_taxiing_to_runway += 1
                    last_unit = other_unit

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
            text = f"{unit.callsign}, {self.airport_name} ground, continue taxi to parking."
        else:
            unit.set_atc_state(ATCState.TAXIING_TO_RUNWAY)
            
            if units_taxiing_to_runway == 1:
                text = f"{unit.callsign}, {self.airport_name} ground, taxi to runway {self.active_runway}."
            else:
                text = f"{unit.callsign}, {self.airport_name} ground, number {units_taxiing_to_runway} taxi to runway {self.active_runway} behind the {last_unit.name}."

        if units_taxiing_to_parking > 0:
            text += f" Be advised, there are {units_taxiing_to_parking} other aircraft taxiing to parking."
        return text
        
    def check_unit_position(self, unit: ATCUnit):
        if self.hold_short_box is None or len(self.hold_short_box) < 3:
            self.logger.warning(f"Invalid hold short box configuration")
            return False
        
        # Check if the unit is inside the hold short box polygon
        is_inside = self.check_unit_in_hold_short_box(unit)
        
        if is_inside:
            self.logger.debug(f"Unit {unit.ID} is inside the hold short box")
            self.unit_in_hold_short_box(unit)

        # Check the unit's speed and if it's taxiing without permission, send instructions
        if unit.get_atc_state() in [ATCState.UNKNOWN, ATCState.STARTING_UP] and unit.speed > 5:
            self.logger.info(f"Unit {unit.ID} is taxiing without permission, sending instructions")
            self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} ground, if you are on this frequency hold position and request taxi clearance.")

            # Set the ground state to taxiing to runway to avoid repeated messages
            unit.set_atc_state(ATCState.TAXIING_TO_RUNWAY)

        # If the unit is airborne and sufficiently high or far away, release control
        if unit.airborne and (unit.position.alt - self.runway_elevation > ALTITUDE_THRESHOLD or unit.position.distance_to(self.runway_center) > DISTANCE_THRESHOLD):
            self.logger.info(f"Unit {unit.ID} is airborne, releasing ground control")

            # Send a message to the unit
            self._send_message_to_unit(unit, f"{unit.callsign}, monitor {Unicom.frequency / 1e6:.3f} for further instructions.")
            unit.set_controlling_agency(Unicom)
            unit.set_atc_state(ATCState.UNKNOWN)

    def unit_in_hold_short_box(self, unit: ATCUnit):
        # If the unit is in the hold short box and has not yet started taxiing, send taxi instructions
        if unit.get_atc_state() == ATCState.TAXIING_TO_RUNWAY:
            self.logger.info(f"Unit {unit.ID} is in hold short box, switch to tower")
            if self.tower is not None:
                self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} ground, contact tower on {self.tower.frequency / 1e6}.")
                self.tower.transfer_unit(unit)
            else:
                self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} ground, monitor {Unicom.frequency}.")
                unit.set_controlling_agency(Unicom)

    def transfer_unit(self, unit: ATCUnit):
        # This unit has been transferred to this agency from another
        self.logger.info(f"Unit {unit.ID} has been transferred to ground ATC")
        unit.set_controlling_agency(self)
        unit.set_atc_state(ATCState.TAXIING_TO_PARKING)
            
    
