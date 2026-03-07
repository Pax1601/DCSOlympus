import logging
from api import API, Unit
from data.data_types import LatLng
from enum import Enum

# Enum for possible ATC states
class ATCState(Enum):
    UNKNOWN = "unknown"
    STARTING_UP = "starting_up"
    TAXIING_TO_RUNWAY = "taxiing_to_runway"
    TAXIING_TO_PARKING = "taxiing_to_parking"
    HOLDING_SHORT = "holding_short"
    WAITING_FOR_TAKEOFF = "waiting_for_takeoff"
    TAKING_OFF = "taking_off"
    LANDING = "landing"
    DEPARTING = "departing"
    ARRIVING = "arriving"
    WAITING_FOR_LANDING = "waiting_for_landing"
    GOING_AROUND = "going_around"
    TOUCH_AND_GO = "touch_and_go"

class ATCAgency:
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "bm_daniel"):
        self.airport_name = airport_name
        self.api = api
        self.config = config
        self.frequency = frequency
        self.voice = voice  # Store the voice for this agency

        self.logger = logging.getLogger("olympus_ATC")

        # Startup the radio listener on the provided frequency
        self.listener = api.create_radio_listener()
        self.listener.start(frequency=self.frequency, modulation=0, encryption=0)
        self.listener.register_message_callback(lambda recognized_text, unit_id, self=self: self.on_message_received(recognized_text, unit_id))

        # Compute the center of the runway fom the config
        self.active_runway = self.config.get("active_runway", None)

        if self.active_runway is None:
            self.logger.error("No active runway specified in Ground ATC config")

        # Get the active runway
        runway_info = self.config.get("runways", {}).get(self.active_runway, None)
        if runway_info is None:
            self.logger.error(f"Active runway '{self.active_runway}' not found in Ground ATC config")

        # Compute the center point of the runway. Chech that there are at least 3 coords
        coords = runway_info.get("runwayBox", [])

        if len(coords) < 3:
            self.logger.error(f"Runway '{self.active_runway}' does not have enough coordinates to define a runway box")
        
        latitudes = [coord[0] for coord in coords]
        longitudes = [coord[1] for coord in coords]
        self.runway_center = LatLng(sum(latitudes) / len(latitudes), sum(longitudes) / len(longitudes), runway_info.get("elevation", 0))

        # Define a runway box
        self.runway_box = coords

        # Get the runway elevation
        self.runway_elevation = runway_info.get("elevation", 0)

        # Get the hold short boxes from the active runway (can be multiple)
        hold_short_boxes = runway_info.get("holdShortBoxes", None)
        if hold_short_boxes is None:
            self.logger.warning(f"Runway '{self.active_runway}' does not have hold short boxes defined")
            self.hold_short_boxes = []
        else:
            self.hold_short_boxes = hold_short_boxes

    def on_message_received(self, recognized_text: str, unit_id: int):
        # Handle incoming messages for ground ATC
        self.logger.debug(f"ATC received message from unit {unit_id}: {recognized_text}")

        # Find the unit that sent the message
        units = self.api.get_units()
        unit = units.get(unit_id, None)

        if unit is None:
            self.logger.error(f"Received message from unknown unit ID {unit_id}")
            return
        
        # Check if the unit is under ground control by this agency
        if isinstance(unit, ATCUnit) and unit.get_controlling_agency() == self:
            # Process the message
            self.logger.info(f"Processing message from unit {unit_id} under control: {recognized_text}")

        # Check that the unit is indeed a ATCUnit, else its an error
        if not isinstance(unit, ATCUnit):
            self.logger.error(f"Unit {unit_id} is not a ATCUnit, cannot process ground messages")
            return
        
        self.handle_message(recognized_text, unit)

    def check_unit_in_hold_short_box(self, unit) -> bool:
        """Check if unit is in any of the hold short boxes."""
        for hold_short_box in self.hold_short_boxes:
            if self._point_in_polygon(unit.position.lat, unit.position.lng, hold_short_box):
                return True
        return False
    
    def check_unit_in_runway(self, unit) -> bool:
        return self._point_in_polygon(unit.position.lat, unit.position.lng, self.runway_box)
    
    def check_runway_clear(self, unit) -> bool:
        # Check if the runway is clear
        units = self.api.get_units()

        for other_unit in units.values():
            if other_unit.alive and not other_unit.airborne and other_unit != unit and self.check_unit_in_runway(other_unit):
                return False
        return True
    
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

    def transfer_unit(self, unit):
        pass

    def handle_message(self, recognized_text: str, unit):
        pass

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
    
    def _point_in_polygon(self, lat: float, lng: float, polygon: list) -> bool:
        n = len(polygon)
        inside = False
        
        p1_lat, p1_lng = polygon[0]
        for i in range(1, n + 1):
            p2_lat, p2_lng = polygon[i % n]
            
            # Check if point is on an horizontal ray to the right of the point
            if lng > min(p1_lng, p2_lng):
                if lng <= max(p1_lng, p2_lng):
                    if lat <= max(p1_lat, p2_lat):
                        if p1_lng != p2_lng:
                            x_intersection = (lng - p1_lng) * (p2_lat - p1_lat) / (p2_lng - p1_lng) + p1_lat
                            if p1_lat == p2_lat or lat <= x_intersection:
                                inside = not inside
            
            p1_lat, p1_lng = p2_lat, p2_lng
        
        return inside

class ATCUnit(Unit):
    def set_atc_state(self, state: ATCState = ATCState.UNKNOWN):
        old_state = self.get_atc_state()
        self.atc_state = state

        # Log the state change
        logger = logging.getLogger("olympus_ATC")
        logger.info(f"Unit {self.ID} ATC state changed from {old_state} to {state}")
    
    def get_atc_state(self) -> ATCState:
        return getattr(self, 'atc_state', ATCState.UNKNOWN)
    
    def set_controlling_agency(self, agency: ATCAgency):
        self.controlling_agency = agency

    def get_controlling_agency(self) -> ATCAgency:
        return getattr(self, 'controlling_agency', None)
    
    def set_order(self, order: int):
        self.current_order = order

    def get_order(self) -> int:
        return getattr(self, 'current_order', 0)
        
class Unicom(ATCAgency):
    frequency: float = 122.800e6
