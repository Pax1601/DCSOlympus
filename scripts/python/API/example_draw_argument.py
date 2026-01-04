from api import API
import logging

logger = logging.getLogger(__name__)

def on_api_startup(api: API):
    units = api.update_units()
    for unit in units.values():
        if unit.name == "UH-1H":
            # Register draw argument 43 for UH-1H
            unit.register_draw_argument(43)

def on_api_update(api: API):
    units = api.get_units()
    for unit in units.values():
        if unit.name == "UH-1H":
            logger.info(f"Draw Arguments for {unit.name}:")
            for draw_arg in unit.draw_arguments:
                logger.info(f"  Argument: {draw_arg.argument}, Value: {draw_arg.value}")

##############################################################################################
# Main entry point for the script. It registers the callbacks and starts the API.
##############################################################################################         
if __name__ == "__main__":
    # Initialize the API
    api = API()
    
    # Register the callbacks
    api.register_on_update_callback(on_api_update)
    api.register_on_startup_callback(on_api_startup)

    # Start the API, this will run forever until stopped
    api.run()
    