
from math import pi

from api import API, UnitSpawnTable
from radio.radio_listener import RadioListener

# Setup a logger for the module
import logging
logger = logging.getLogger("OlympusVoiceControl")
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
        spawn_location = unit.position.project_with_bearing_and_distance(bearing=unit.heading+pi/2, d=10)
        spawn_table: UnitSpawnTable = UnitSpawnTable(
            unit_type="Soldier M4",
            location=spawn_location,
            heading=unit.heading+pi/2,
            skill="High",
            livery_id=""            
        )
        api.spawn_ground_units([spawn_table], unit.coalition, "", True, 0)
        message_filename = api.generate_audio_message("Roger, disembarking")
        listener.transmit_on_frequency(message_filename, listener.frequency, listener.modulation, listener.encryption)
    else:   
        logger.info("Did not understand the message or no disembarkment request found.")
        message_filename = api.generate_audio_message("I did not understand")
        listener.transmit_on_frequency(message_filename, listener.frequency, listener.modulation, listener.encryption)
        
if __name__ == "__main__":
    api = API()
    logger.info("API initialized")
    
    listener = api.create_radio_listener()
    listener.start(frequency=251.000e6, modulation=0, encryption=0)
    listener.register_message_callback(lambda wav_filename, unit_id, api=api, listener=listener: on_message_received(wav_filename, unit_id, api, listener))

    api.run()