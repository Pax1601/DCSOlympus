from api import API, LatLng, Unit
import logging
from data.data_types import BoundingPolygon
from atc.utils import compute_runway_headings, pick_runway_from_wind_direction, read_metar, normalize_metar

class Runway:
    def __init__(self, name: str, config: dict, coordinates: list[LatLng], logger: logging.Logger):
        self.name = name
        self.bounding_polygon = BoundingPolygon(coordinates)
        self.takeoff_procedure = config.get("takeoff_procedure", [])
        self.pattern_direction = config.get("pattern_direction", "left")
        self.logger = logger

    def is_clear(self, units: list[Unit]):
        # Check if any unit is on the ground within the runway coordinates
        for unit in units:
            if not unit.airborne:
                if self.bounding_polygon.contains(unit.position):
                    return False
        
        # If no units are found on the runway, it is clear
        return True
    
    def get_pattern_direction(self):
        return self.pattern_direction
    
    def get_takeoff_procedure(self):
        return self.takeoff_procedure
    
    def get_threshold_coordinates(self):
        self.logger.warning("Runway.get_threshold_coordinates() not implemented yet")
        return LatLng(0, 0, 0)  # TODO: Placeholder implementation
    
    def get_heading(self):
        headings = compute_runway_headings(self.bounding_polygon.coordinates)
        
        # The name of the runway indicates which heading to return
        # First remove any letter from the name (e.g., "09L" -> "09")
        runway_number = ''.join(filter(str.isdigit, self.name))
        runway_heading = int(runway_number) * 10  # Convert to degrees
        
        # Compute the difference to each heading
        diff_heading_1 = abs(headings[0] - runway_heading)
        diff_heading_2 = abs(headings[1] - runway_heading)

        # Normalize to avoid issues around 0/360 degrees. The maximum difference is 180 degrees.
        if diff_heading_1 > 180:
            diff_heading_1 = 360 - diff_heading_1
        if diff_heading_2 > 180:
            diff_heading_2 = 360 - diff_heading_2

        # Return the heading that is closest to the runway heading
        if diff_heading_1 < diff_heading_2:
            return headings[0]
        else:
            return headings[1]
        
    def get_name(self):
        return self.name
    
    def spell_name(self):
        # Spell out the runway name for radio transmission
        spelled_name = ' '.join(self.name)
        if 'L' in self.name:
            spelled_name = spelled_name.replace('L', ' Left')
        elif 'R' in self.name:
            spelled_name = spelled_name.replace('R', ' Right')
        elif 'C' in self.name:
            spelled_name = spelled_name.replace('C', ' Center')
        return spelled_name

class Airbase:
    def __init__(self, name, config: dict, api: API, logger: logging.Logger, kml: dict):
        self.name = name
        self.api = api
        self.logger = logger
        self.kml = kml
        self.runways: list[Runway] = []
        self.metar = None
        self.weather_data = None
        self.last_weather_update_time = None
        self.active_runway = None
        self.letter = "Alpha"  # Default letter

        self.logger.info(f"Initializing Airbase: {name}")

        # Initialize runways from config
        self.initialize_runways(config.get("runways", {}), kml)
        self.active_runway = self.runways[0] if self.runways else None # Set first runway as active by default

        # Get ICAO code from config
        self.ICAO = config.get("icao", "XXXX")
        
        # Initialize components to None
        self.atis = None
        self.base = None
        self.ground = None
        self.tower = None
        self.approach = None
        
        # Check if the config has a "atis" section
        self.atis_config = config.get("atis", None)
        if self.atis_config:
            pass
            #TODO self.atis = ATIS(name + " ATIS", self.atis_config, api, logger)

        from atc.agency.base import Base
        from atc.agency.ground import Ground
        from atc.agency.tower import Tower
        from atc.agency.approach import Approach
            
        # Check if the config has a "base" section
        self.base_config = config.get("base", None)
        if self.base_config:
            self.base = Base(name + " Base", self.base_config, api, logger, self.kml, self)
            
        # Check if the config has a "ground" section
        self.ground_config = config.get("ground", None)
        if self.ground_config:
            self.ground = Ground(name + " Ground", self.ground_config, api, logger, self.kml, self)
            
        # Check if the config has a "tower" section
        self.tower_config = config.get("tower", None)
        if self.tower_config:
            self.tower = Tower(name + " Tower", self.tower_config, api, logger, self.kml, self)
            
        # Check if the config has an "approach" section
        self.approach_config = config.get("approach", None,)
        if self.approach_config:
            self.approach = Approach(name + " Approach", self.approach_config, api, logger, self.kml, self)

        # If present, read the metar string from the config
        self.metar = config.get("metar", None)
        if self.metar:
            self.logger.info(f"Airbase {self.name} has METAR: {self.metar}")

    def initialize_runways(self, config: dict, kml: dict):
        # Placeholder for runway initialization logic
        self.logger.info(f"Initializing runways for Airbase: {self.name}")

        for runway_pair_name, runway_pair_config in config.items():
            # Find corresponding KML data for the runway
            runway_kml = kml.get(runway_pair_name, {})

            if not runway_kml:
                self.logger.warning(f"No KML data found for runway: {runway_pair_name} in airbase: {self.name}")
                continue

            # Each runway is split in two directions
            for runway_name, runway_config in runway_pair_config.items():
                # Create Runway instance
                runway = Runway(runway_name, runway_config, runway_kml.get("coordinates", []), self.logger)
                self.runways.append(runway)

    def update_weather(self, timestring_top_of_hour: str, letter: str):
        if self.metar is None:
            return  # No weather data to update
        
        if self.last_weather_update_time == timestring_top_of_hour:
            return  # Weather already updated for this hour
        
        # Update the letter
        self.letter = letter
        
        # Update the weather data timestamp
        self.last_weather_update_time = timestring_top_of_hour

        # Normalize the metar string
        self.metar = normalize_metar(self.metar, self.ICAO, timestring_top_of_hour)

        # Read the metar to extract weather data
        self.weather_data = read_metar(self.metar)

        # Get the wind direction from the weather data
        wind_direction = self.weather_data.get("wind_dir", None)
        if wind_direction is not None:
            self.logger.info(f"Airbase {self.name} wind direction: {wind_direction} degrees")
            # Determine the runway closest to the wind direction
            closest_runway = pick_runway_from_wind_direction(wind_direction, self.runways)
            if closest_runway:
                self.logger.info(f"Closest runway to wind direction at Airbase {self.name} is {closest_runway.name} with heading {closest_runway.get_heading()} degrees")
                self.active_runway = closest_runway
            else:
                self.logger.warning(f"No runways found for Airbase {self.name} to determine closest to wind direction")
        else:
            self.logger.warning(f"No wind direction data available in METAR for Airbase {self.name}")

        self.logger.info(f"Updated weather for Airbase {self.name}: {self.weather_data}")
        # TODO: ATIS, if present, should also be updated with new weather data
    
    def get_active_runway(self):
        return self.active_runway
    
    def get_weather_data(self):
        return self.weather_data
    
    def get_metar(self):
        return self.metar
    
    def get_weather_letter(self):
        return self.letter