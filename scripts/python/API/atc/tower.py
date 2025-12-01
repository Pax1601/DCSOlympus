from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom

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

    def handle_message(self, recognized_text: str, unit: ATCUnit):
        if "tower" not in recognized_text.lower():
            return  # Not a tower message

        # Define a list of trigger words and the callback to execute if they are found
        trigger_words = [
            (["departure"], self.handle_takeoff_request),
            (["land", "final", "beam"], self.handle_landing_request),
            (["initial", "break", "overhead"], self.handle_break_request),
            (["go around", "missed approach"], self.handle_go_around_request),
        ]

        text = None
        for words, callback in trigger_words:
            if any(word in recognized_text.lower() for word in words):
                text = callback(unit)     
                break  

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
                        self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} tower, runway {' '.join(self.active_runway)} cleared for takeoff.")
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
                        self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} tower, runway {' '.join(self.active_runway)} cleared to land.")
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
        return f"{unit.callsign}, {self.airport_name} tower, runway {' '.join(self.active_runway)} cleared to land."

    def handle_break_request(self, unit: ATCUnit):
        self.logger.info(f"Clearing unit {unit.ID} for overhead break")
        unit.set_atc_state(ATCState.ARRIVING)
        return f"{unit.callsign}, {self.airport_name} tower, cleared for overhead break at your discretion."
    
    def handle_go_around_request(self, unit: ATCUnit):
        self.logger.info(f"Unit {unit.ID} going around")
        unit.set_atc_state(ATCState.GOING_AROUND)
        return f"{unit.callsign}, {self.airport_name} tower, go around. Climb to pattern altitude and enter downwind for runway {' '.join(self.active_runway)}."

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

        