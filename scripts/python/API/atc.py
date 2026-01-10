from api import API
import logging
from atc.atc_unit import ATCUnit
from atc.agency.radar import Radar
from atc.constants import UTC_differences
import json

from atc.utils import date_and_time_to_string_and_letter, parse_kml_file

logger = logging.getLogger("olympus_ATC")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
# Prevent double logging by not propagating to parent loggers
logger.propagate = False

def update_atc(api: API, radars: list[Radar]):
    # Get the units from the API
    units = api.get_units()
    
    # Transform human units into ATCUnit instances
    for unit in units.values():
        if unit.human and not isinstance(unit, ATCUnit):
            logger.info(f"Transforming {unit.unit_id} into ATCUnit")
            unit.__class__ = ATCUnit

            # Initialize the ATC unit and set its radars. Remember, the radars contain all other agencies inside them.
            unit.initialize()
            unit.set_radars(radars)
        
        # Call the "update" method on all ATC units
        if isinstance(unit, ATCUnit):
            unit.update()

    # Get the mission data from the API
    mission_data = api.update_mission()

    # Extract the current time from the mission data
    current_time = mission_data.get("dateAndTime", 0)
    (timestring, timestring_top_of_hour, letter) = date_and_time_to_string_and_letter(current_time, UTC_differences.get(mission_data.get("theatre"), 0))

    # Iterate over all the airbases in all radars to update their weather information
    for radar in radars:
        for airbase in radar.get_airbases():
            airbase.update_weather(timestring_top_of_hour, letter)

    # Iterate over all radars to perform their periodic updates
    for radar in radars:
        radar.update()
             
def initialize_agencies(api: API) -> list[Radar]:
    radars = []
    
    # Placeholder for agency initialization logic
    logger.info("Initializing ATC agencies")
    
    # Read the "atc.json" configuration file
    config_path = "atc.json"
    try:
        with open(config_path, 'r') as config_file:
            config_data = config_file.read()
            config_data = json.loads(config_data)
            logger.info(f"Loaded ATC configuration: {config_data}")

            # Load the kml file
            kml = parse_kml_file(config_data.get("kml"), logger)
            
            # The root elements of the dict are the Radar agencies. Other agancies are created inside the radar itself.
            for radar_name, radar_config in config_data.get("radars").items():
                logger.info(f"Setting up Radar agency: {radar_name}")
                radar = Radar(radar_name, radar_config, api, logger, kml)
                radars.append(radar)
            return radars
        
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {config_path}")
    
if __name__ == "__main__":
    # Initialize the API
    api = API(load_kokoro=True, load_whisper=True)
    logger.info("API initialized")
    
    # Initialize ATC agencies
    radars = initialize_agencies(api) # TODO: Make kml path configurable

    # Register the update callback to be called periodically
    api.register_on_update_callback(lambda api=api, radars=radars: update_atc(api, radars))

    api.run()
