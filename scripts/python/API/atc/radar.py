from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
from typing import List


# Keywords that identify this as a radar message
radar_keywords = ["radar", "center", "control"]

class RadarATC(ATCAgency):
    def __init__(self, area_name: str, api: API, config: dict, frequency: float, voice: str = "am_adam"):
        # Radar doesn't have a single airport, so we pass None or area_name
        # We need to override the parent __init__ to handle this differently
        self.api = api
        self.area_name = area_name
        self.airport_name = area_name  # For compatibility with base class
        self.config = config
        self.frequency = frequency
        self.voice = voice
        self.agencies = []  # List of all other agencies to check for transfers
        
        # Setup logger
        import logging
        self.logger = logging.getLogger(f"olympus_ATC.Radar.{area_name}")
        self.logger.setLevel(logging.INFO)
        
        if self.frequency is None:
            raise ValueError("Radar ATC frequency not specified in config")
        
        # Get radar coordinates (coverage area) - config is passed directly with coordinates and vertical
        self.radar_coordinates = self.config.get("coordinates", [])
        if not self.radar_coordinates:
            raise ValueError(f"Radar ATC '{area_name}' must have coordinates defined")
        
        self.use_polygon_control = True
        
        # Get vertical limits from config
        vertical = self.config.get("vertical", {})
        if vertical:
            # Parse lower limit
            lower = vertical.get("lower", "SFC")
            if lower == "SFC" or lower == "sfc":
                self.control_altitude_lower = 0.0
            else:
                # Assume it's in feet
                self.control_altitude_lower = float(lower) * 0.3048  # Convert feet to meters
            
            # Parse upper limit
            upper = vertical.get("upper", 60000)
            if isinstance(upper, str) and (upper.upper() == "SFC"):
                self.control_altitude_upper = 0.0
            else:
                # Assume it's in feet
                self.control_altitude_upper = float(upper) * 0.3048  # Convert feet to meters
        else:
            self.logger.warning(f"No vertical limits defined for {area_name}, using defaults")
            self.control_altitude_lower = 0.0
            self.control_altitude_upper = 60000 * 0.3048  # 60000 feet (FL600) in meters
        
        # Startup the radio listener on the provided frequency
        self.listener = api.create_radio_listener()
        self.listener.start(frequency=self.frequency, modulation=0, encryption=0)
        self.listener.register_message_callback(lambda recognized_text, unit_id, self=self: self.on_message_received(recognized_text, unit_id))

    def set_agencies(self, agencies: List[ATCAgency]):
        """Set the list of all other ATC agencies to check for transfers."""
        self.agencies = agencies

    def check_unit_in_radar_zone(self, unit) -> bool:
        """Check if unit is within the radar control zone."""
        if self.use_polygon_control:
            # Check if unit is inside radar polygon
            return self._point_in_polygon(unit.position.lat, unit.position.lng, self.radar_coordinates)
        else:
            # Fallback to radius-based control - for radar, check from some central point
            # If no specific center is defined, just use large radius from origin
            # This is a simplified approach; ideally you'd have a center point defined
            return True  # Radar covers everything when no polygon is defined
    
    def check_unit_altitude_in_control(self, unit) -> bool:
        """Check if unit altitude is within radar control limits."""
        # For radar, use absolute altitude since it covers large areas
        altitude_msl = unit.position.alt
        return self.control_altitude_lower <= altitude_msl <= self.control_altitude_upper

    def update(self):
        units = self.api.get_units()

        for unit in units.values():
            # Only monitor airborne units
            if unit.alive and unit.human and unit.airborne:
                # Check if unit is within radar zone and altitude limits
                in_radar_zone = self.check_unit_in_radar_zone(unit)
                in_altitude = self.check_unit_altitude_in_control(unit)
                
                # If unit is under our control, check if they should be transferred to another agency
                if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                    # Check all agencies to see if unit is in their airspace
                    for agency in self.agencies:
                        if agency == self:
                            continue
                        
                        # Check if this agency can control this unit
                        if hasattr(agency, 'check_unit_in_atz') and hasattr(agency, 'check_unit_altitude_in_control'):
                            # This is likely a tower
                            if agency.check_unit_in_atz(unit) and agency.check_unit_altitude_in_control(unit):
                                self.logger.info(f"Transferring unit {unit.ID} to {agency.airport_name} tower")
                                unit.set_controlling_agency(agency)
                                agency.transfer_unit(unit)
                                self._send_message_to_unit(unit, f"{unit.callsign}, contact {agency.airport_name} tower on {self._format_frequency_for_speech(agency.frequency)}.")
                                break
                        elif hasattr(agency, 'check_unit_in_approach_zone') and hasattr(agency, 'check_unit_altitude_in_control'):
                            # This is likely an approach
                            if agency.check_unit_in_approach_zone(unit) and agency.check_unit_altitude_in_control(unit):
                                self.logger.info(f"Transferring unit {unit.ID} to {agency.airport_name} approach")
                                unit.set_controlling_agency(agency)
                                agency.transfer_unit(unit)
                                self._send_message_to_unit(unit, f"{unit.callsign}, contact {agency.airport_name} approach on {self._format_frequency_for_speech(agency.frequency)}.")
                                break
                        elif hasattr(agency, 'check_unit_in_radar_zone') and hasattr(agency, 'check_unit_altitude_in_control'):
                            # This is another radar zone
                            if agency.check_unit_in_radar_zone(unit) and agency.check_unit_altitude_in_control(unit):
                                self.logger.info(f"Transferring unit {unit.ID} to {agency.area_name} radar")
                                unit.set_controlling_agency(agency)
                                agency.transfer_unit(unit)
                                self._send_message_to_unit(unit, f"{unit.callsign}, contact {agency.area_name} radar on {self._format_frequency_for_speech(agency.frequency)}.")
                                break
                    
                    continue
                
                # Take control if unit is in our zone and not controlled by a more specific agency
                if in_radar_zone and in_altitude:
                    # If the unit is controlled by another agency, skip it (they have priority)
                    if isinstance(unit, ATCUnit) and unit.get_controlling_agency() != self and unit.get_controlling_agency() != Unicom:
                        continue

                    # Take control of the unit
                    unit.__class__ = ATCUnit
                    unit.set_atc_state(ATCState.UNKNOWN)
                    unit.set_controlling_agency(self)
                    self.logger.info(f"Unit {unit.ID} is now under radar control")
                else:
                    if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
                        # If the unit is outside of control area, release it
                        self.logger.info(f"Releasing unit {unit.ID} from radar control")
                        self._send_message_to_unit(unit, f"{unit.callsign}, radar services terminated, monitor {self._format_frequency_for_speech(Unicom.frequency)}.")
                        unit.set_controlling_agency(Unicom)

    def check_unit_position(self, unit: ATCUnit):
        # Radar primarily monitors position for transfers, which is handled in update()
        pass
    
    def handle_message(self, recognised_text: str, unit: ATCUnit):
        self.logger.debug(f"Original text: '{recognised_text}'")
        
        # Check if this is a radar message
        if not any(keyword in recognised_text.lower() for keyword in radar_keywords):
            return  # Not a radar message
        
        # Simple acknowledgment
        self.logger.info(f"Acknowledging radar message from unit {unit.ID}")
        self._send_message_to_unit(unit, f"{unit.callsign}, {self.area_name} radar, radar contact.")

    def transfer_unit(self, unit: ATCUnit):
        # This unit has been transferred to this agency from another
        self.logger.info(f"Unit {unit.ID} has been transferred to radar ATC")
        unit.set_controlling_agency(self)
    
    def _format_frequency_for_speech(self, frequency_hz: float) -> str:
        """
        Format a frequency in Hz for speech synthesis.
        Example: 180325000 Hz becomes "1 8 0 decimal 3 2 5"
        """
        # Convert to MHz and format with 3 decimal places
        frequency_mhz = frequency_hz / 1e6
        frequency_str = f"{frequency_mhz:.3f}"
        
        # Split into whole and decimal parts
        if '.' in frequency_str:
            whole_part, decimal_part = frequency_str.split('.')
        else:
            whole_part = frequency_str
            decimal_part = ""
        
        # Format whole part with spaces between digits
        formatted_whole = ' '.join(whole_part)
        
        # Format decimal part with spaces between digits, remove trailing zeros
        if decimal_part:
            decimal_part = decimal_part.rstrip('0')  # Remove trailing zeros
            if decimal_part:  # If there are still digits after removing zeros
                formatted_decimal = ' '.join(decimal_part)
                return f"{formatted_whole} decimal {formatted_decimal}"
        
        return formatted_whole

    def _send_message_to_unit(self, unit, text: str):
        self.logger.info(f"Generating response to unit {unit.ID}: {text}")

        # Generate audio using this agency's assigned voice
        audio_file = self.api.generate_audio_message(text, voice=self.voice)
        self.logger.info(f"Generated audio file: {audio_file}")
        
        # Transmit the audio back on the same frequency
        success = self.listener.transmit_on_frequency(
            file_name=audio_file,
            frequency=self.listener.frequency,
            modulation=self.listener.modulation,
            encryption=self.listener.encryption
        )
        
        if success:
            self.logger.info("Message transmitted successfully")
        else:
            self.logger.error("Failed to transmit message")
            
        # Clean up the temporary audio file
        import os
        if os.path.exists(audio_file):
            os.remove(audio_file)
            self.logger.debug(f"Cleaned up audio file: {audio_file}")
    
    def _point_in_polygon(self, lat: float, lng: float, polygon: list) -> bool:
        """Check if a point is inside a polygon using ray-casting algorithm."""
        x, y = lat, lng
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
