
from math import pi
import os

from api import API, UnitSpawnTable
from radio.radio_listener import RadioListener

# Setup a logger for the module
import logging
logger = logging.getLogger("example_intercom")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Function to handle received messages
# This function will be called when a message is received on the radio frequency
def on_message_received(recognized_text: str, unit_id: str, api: API, listener: RadioListener):
    logger.info(f"Received message from {unit_id}: {recognized_text}")
        
    units = api.update_units()
    
    # Extract the unit that sent the message
    if not units:
        logger.warning("No units available in API, unable to process audio.")
        return
    
    if unit_id not in units:
        logger.warning(f"Unit ID {unit_id} not found in API units, unable to process audio.")
        return
    
    unit = units[unit_id]

    # Check for troop disembarkment request (expanded)
    keywords = [
        "disembark troops",
        "deploy troops",
        "unload troops",
        "drop off troops",
        "let troops out",
        "troops disembark",
        "troops out",
        "extract infantry",
        "release soldiers",
        "disembark infantry",
        "release troops"
    ]
    is_disembarkment = any(kw in recognized_text.lower() for kw in keywords)
    
    # Check if "olympus" is mentioned
    is_olympus = "olympus" in recognized_text.lower()
    
    if is_olympus and is_disembarkment:
        logger.info("Troop disembarkment requested!")

        # Use the API to spawn an infrantry unit 10 meters away from the unit
        spawn_location = unit.position.project_with_bearing_and_distance(bearing=unit.heading+pi/2, distance=10)
        spawn_table: UnitSpawnTable = UnitSpawnTable(
            unit_type="Soldier M4",
            location=spawn_location,
            heading=unit.heading+pi/2,
            skill="High",
            livery_id=""            
        )
        api.spawn_ground_units([spawn_table], unit.coalition, "", True, 0)
        message_filename = api.generate_audio_message("Roger, disembarking")
        listener.transmit_on_intercom(message_filename, unit_id)
    else:   
        logger.info("Did not understand the message or no disembarkment request found.")
        message_filename = api.generate_audio_message("I did not understand")
        listener.transmit_on_intercom(message_filename, unit_id)
        
    # Delete the message file after processing
    os.remove(message_filename)
        
if __name__ == "__main__":
    api = API()
    logger.info("API initialized")
    
    api.update_units()
    
    # Find the unit ID of the first human unit
    human_unit_id = None
    for unit in api.units.values():
        if unit.human:
            human_unit_id = unit.unit_id
            break
        
    if human_unit_id is None:
        logger.error("No human unit found in the simulation. Exiting.")
        exit(1)
        
    # Setup the radio listener
    listener = api.create_radio_listener()
    listener.register_message_callback(lambda text, unit_id: on_message_received(text, unit_id, api, listener))
    listener.start_on_intercom(human_unit_id)

    api.run()