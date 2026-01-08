from api import API
import logging
from atc.atc_unit import ATCUnit
from atc.agency.radar import Radar

logger = logging.getLogger("olympus_ATC")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
# Prevent double logging by not propagating to parent loggers
logger.propagate = False

def update_atc(api: API):
    # Get the units from the API
    units = api.get_units()
    
    # Transform human units into ATCUnit instances
    for unit in units.values():
        if unit.human and not isinstance(unit, ATCUnit):
            logger.info(f"Transforming {unit.unit_id} into ATCUnit")
            unit.__class__ = ATCUnit
        
        # Call the "update" method on all ATC units
        if isinstance(unit, ATCUnit):
            unit.update()
             
def initialize_agencies(api: API):
    radars = []
    
    # Placeholder for agency initialization logic
    logger.info("Initializing ATC agencies")
    
    # Read the "atc.json" configuration file
    config_path = api.get_config_path("atc.json")
    try:
        with open(config_path, 'r') as config_file:
            config_data = config_file.read()
            logger.info(f"Loaded ATC configuration: {config_data}")
            
            # The root elements of the dict are the Radar agencies. Other agancies are created inside the radar itself.
            for radar_name, radar_config in config_data.items():
                logger.info(f"Setting up Radar agency: {radar_name}")
                radar = Radar(radar_name, radar_config, api, logger)
                radars.append(radar)
            return radars
        
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {config_path}")
    
if __name__ == "__main__":
    # Initialize the API
    api = API(load_kokoro=True, load_whisper=True)
    logger.info("API initialized")
    
    # Initialize ATC agencies
    radars = initialize_agencies(api)

    # Register the update callback to be called periodically
    api.register_on_update_callback(lambda api=api: update_atc(api))

    api.run()
