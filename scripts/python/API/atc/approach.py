from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom

# Keywords that identify this as an approach message
approach_keywords = ["approach", "departure"]

class ApproachATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "am_adam"):
        super().__init__(airport_name, api, config, frequency, voice)
        self.tower = None
        self.radar = None
        
        if self.frequency is None:
            raise ValueError("Approach ATC frequency not specified in config")
        
        # Get approach data from config
        approach = self.config.get("approach", {})
        
        # Get approach coordinates
        self.approach_coordinates = approach.get("coordinates", [])
        if not self.approach_coordinates:
            self.logger.warning(f"No approach coordinates defined for {airport_name}, using default control radius")
            self.use_polygon_control = False
            self.control_radius = 30 * 1852  # 30 NM in meters as fallback
        else:
            self.use_polygon_control = True
        
        # Get vertical limits from approach data
        vertical = approach.get("vertical", {})
        if vertical:
            # Parse lower limit
            lower = vertical.get("lower", "SFC")
            if lower == "SFC" or lower == "sfc":
                self.control_altitude_lower = 0.0
            else:
                # Assume it's in feet
                self.control_altitude_lower = float(lower) * 0.3048  # Convert feet to meters
            
            # Parse upper limit
            upper = vertical.get("upper", 15000)
            if isinstance(upper, str) and (upper.upper() == "SFC"):
                self.control_altitude_upper = 0.0
            else:
                # Assume it's in feet
                self.control_altitude_upper = float(upper) * 0.3048  # Convert feet to meters
        else:
            self.logger.warning(f"No vertical limits defined for {airport_name}, using defaults")
            self.control_altitude_lower = 0.0
            self.control_altitude_upper = 15000 * 0.3048  # 15000 feet in meters

    def set_tower(self, tower: ATCAgency):
        self.tower = tower

    def set_radar(self, radar: ATCAgency):
        self.radar = radar
    
    def check_unit_in_approach_zone(self, unit) -> bool:
        """Check if unit is within the approach control zone."""
        if self.use_polygon_control:
            # Check if unit is inside approach polygon
            return self._point_in_polygon(unit.position.lat, unit.position.lng, self.approach_coordinates)
        else:
            # Fallback to radius-based control
            distance_to_runway = unit.position.distance_to(self.runway_center)
            return distance_to_runway <= self.control_radius
    
    def check_unit_altitude_in_control(self, unit) -> bool:
        """Check if unit altitude is within approach control limits."""
        altitude_agl = unit.position.alt - self.runway_elevation
        return self.control_altitude_lower <= altitude_agl <= self.control_altitude_upper

    def update(self):
        units = self.api.get_units()

        for unit in units.values():
            # Check if the unit is airborne
            if unit.alive and unit.human and unit.airborne:
                # Check if unit is within approach zone and altitude limits
                in_approach_zone = self.check_unit_in_approach_zone(unit)
                in_altitude = self.check_unit_altitude_in_control(unit)
                
                if in_approach_zone and in_altitude:
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
                    unit.set_atc_state(ATCState.UNKNOWN)
                    unit.set_controlling_agency(self)
                    self.logger.info(f"Unit {unit.ID} is now under approach control")
                else:
                    if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                        self.logger.info(f"Releasing unit {unit.ID} from approach control")
                        # Send a message to the unit
                        if self.radar:
                            self._send_message_to_unit(unit, f"{unit.callsign}, contact radar on {self._format_frequency_for_speech(self.radar.frequency)}.")
                            unit.set_controlling_agency(self.radar)
                        else:
                            self._send_message_to_unit(unit, f"{unit.callsign}, monitor {self._format_frequency_for_speech(Unicom.frequency)}.")
                            unit.set_controlling_agency(Unicom)

    def check_unit_position(self, unit: ATCUnit):
        # If the unit is in the ATZ of the tower, transfer it to tower ATC
        if self.tower and self.tower.check_unit_in_atz(unit) and self.tower.check_unit_altitude_in_control(unit) and not unit.get_atc_state() == ATCState.TAKING_OFF and not unit.get_atc_state() == ATCState.DEPARTING:
            self.logger.info(f"Transferring unit {unit.ID} to tower ATC")
            unit.set_controlling_agency(self.tower)
            self.tower.transfer_unit(unit)
            return
    
    def handle_message(self, recognised_text: str, unit: ATCUnit):
        self.logger.debug(f"Original text: '{recognised_text}'")
        
        # Check if this is an approach message
        if not any(keyword in recognised_text.lower() for keyword in approach_keywords):
            return  # Not an approach message
        
        # TODO: Implement message handling logic
        # For now, simply acknowledge the message and tell unit to continue
        self.logger.info(f"Acknowledging approach message from unit {unit.ID}")
        self._send_message_to_unit(unit, f"{unit.callsign}, {self.airport_name} approach, radar contact, continue.")

    def transfer_unit(self, unit: ATCUnit):
        # This unit has been transferred to this agency from another
        self.logger.info(f"Unit {unit.ID} has been transferred to approach ATC")
        unit.set_controlling_agency(self)
