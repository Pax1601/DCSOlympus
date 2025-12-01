from api import API

# Setup a logger for the module
import logging
logger = logging.getLogger("olympus_ATC")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
# Prevent double logging by not propagating to parent loggers
logger.propagate = False

def update_atc(api: API, agencies: list):
    """
    Update all ATC agencies.
    This function should be called periodically to allow each ATC agency to process
    incoming messages and perform necessary actions.
    
    Args:
        api (API): The API instance.
        agencies (list): List of ATC agency instances.
    """
    for agency in agencies:
        try:
            agency.update()
        except Exception as e:
            logger.error(f"Error updating ATC agency {agency}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    # Initialize the API
    api = API(load_kokoro=True, load_whisper=True)
    logger.info("API initialized")

    api.set_whisper_model("base")

    # Read the atc configuration file
    import json
    with open("atc.json", "r") as f:
        atc_config = json.load(f)
    logger.info("ATC configuration loaded")

    # Define available voices for random assignment
    voice_american_female = ["af_heart","af_bella","af_aoede","af_kore","af_sarah","af_nova","af_sky","af_alloy","af_jessica","af_river"]
    voice_american_male = ["am_michael","am_fenrir","am_puck","am_echo","am_eric","am_liam","am_onyx","am_adam"]
    voice_american = voice_american_male + voice_american_female
    voice_british_female = ["bf_emma","bf_isabella","bf_alice","bf_lily"]
    voice_british_male = ["bm_george","bm_fable","bm_lewis","bm_daniel"]
    voices_british = voice_british_male + voice_british_female
    voices = voice_american + voices_british
    
    import random
    available_voices = voices.copy()  # Create a copy to avoid modifying the original list

    agencies = []

    # Iterate over all the airports in the configuration
    for airport_name, airport_config in atc_config.items():
        logger.info(f"Setting up ATC for airport: {airport_name}")
        
       # Agencies are configured under "frequencies" in the config
        for agency_name, frequency in airport_config.get("frequencies", {}).items():
            logger.info(f"  Setting up agency: {agency_name}")
            
            # Assign a random voice and remove it from available voices
            if available_voices:
                assigned_voice = random.choice(available_voices)
                available_voices.remove(assigned_voice)
            else:
                # If we run out of voices, reset the list and pick again
                available_voices = voices.copy()
                assigned_voice = random.choice(available_voices)
                available_voices.remove(assigned_voice)
                logger.warning("Ran out of unique voices, reusing voices for remaining agencies")
            
            if agency_name.lower() == "tower":
                from atc.tower import TowerATC
                tower_atc = TowerATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Tower ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(tower_atc)
            elif agency_name.lower() == "ground":
                from atc.ground import GroundATC
                ground_atc = GroundATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Ground ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(ground_atc)
            elif agency_name.lower() == "base":
                from atc.base import BaseOPSATC
                base_ops_atc = BaseOPSATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Base Ops ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(base_ops_atc)
            else:
                logger.warning(f"    Unknown agency '{agency_name}' for airport '{airport_name}'")

        # If a tower is available set it in the ground controller
        tower_agency = next((a for a in agencies if isinstance(a, TowerATC) and a.airport_name == airport_name), None)
        ground_agency = next((a for a in agencies if isinstance(a, GroundATC) and a.airport_name == airport_name), None)
        if tower_agency is not None and ground_agency is not None:
            ground_agency.set_tower(tower_agency)
            tower_agency.set_ground(ground_agency)
            logger.info(f"    Linked Ground ATC to Tower ATC for {airport_name}")

    logger.info("All ATC agencies set up successfully")

    # Register the update callback to be called periodically
    api.register_on_update_callback(lambda api=api, agencies=agencies: update_atc(api, agencies))

    api.run()

