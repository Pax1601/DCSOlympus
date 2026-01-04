from api import API
from radio.radio_listener import RadioListener

# Setup a logger for the module
import logging
logger = logging.getLogger("example_echo")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
# Prevent double logging by not propagating to parent loggers
logger.propagate = False

# Function to handle received messages
# This function will be called when a message is received on the radio frequency
def on_message_received_tower(recognized_text: str, unit_id: str, api: API, listener: RadioListener):
    logger.info(f"Received message from {unit_id}: {recognized_text}")

    try:
        unit = api.get_units()[unit_id]
        unit_name = unit.callsign + ", "
    except:
        unit_name = "last station calling, "
        
    recognized_text = recognized_text.lower()

    if "tower" not in recognized_text:
        return

    if "taxi" in recognized_text:
        text = "Tower, Clear to taxi runway 2 6"
    elif "departure" in recognized_text:
        text = "Tower, Clear for takeoff runway 2 6"
    elif "initial" in recognized_text:
        text = "Tower, clear into the break 2 6"
    elif "abeam" in recognized_text or "full stop" in recognized_text or "final" in recognized_text:
        text = "Tower, Clear to land runway 2 6, wind calm"
    else:
        text = "Could not understand, say again"
    
    logger.info(f"Generating echo response: {unit_name + text}")

    generate_text(unit_name + text, listener)

def on_message_received_ground(recognized_text: str, unit_id: str, api: API, listener: RadioListener):
    logger.info(f"Received message from {unit_id}: {recognized_text}")

    try:
        unit = api.get_units()[unit_id]
        unit_name = unit.callsign + ", "
    except:
        unit_name = "last station calling, "

    recognized_text = recognized_text.lower()

    if "ground" not in recognized_text:
        return

    if "taxi" in recognized_text:
        text = "Ground, Clear to taxi runway 2 6"
    else:
        text = "Could not understand, say again"
    
    logger.info(f"Generating echo response: {unit_name + text}")

    generate_text(unit_name + text, listener)
    
def generate_text(text, listener): 
    try:
        # Generate audio using Kokoro TTS (now built into the API)
        audio_file = api.generate_audio_message(text, voice="bm_daniel")
        logger.info(f"Generated audio file: {audio_file}")
        
        # Transmit the audio back on the same frequency
        success = listener.transmit_on_frequency(
            file_name=audio_file,
            frequency=listener.frequency,
            modulation=listener.modulation,
            encryption=listener.encryption
        )
        
        if success:
            logger.info("Echo message transmitted successfully")
        else:
            logger.error("Failed to transmit echo message")
            
        # Clean up the temporary audio file
        import os
        if os.path.exists(audio_file):
            os.remove(audio_file)
            logger.debug(f"Cleaned up audio file: {audio_file}")
            
    except Exception as e:
        logger.error(f"Error generating/transmitting echo: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
if __name__ == "__main__":
    api = API()
    logger.info("API initialized")
    
    # Example: Configure Whisper options for better performance
    # These are demonstrations - you can adjust based on your needs
    logger.info("Configuring Whisper transcription options...")
    api.configure_whisper_options(
        fp16=False,                        # Use FP32 for better compatibility
        no_speech_threshold=0.6,           # Skip segments with no speech (0.0-1.0, higher = more aggressive)
        logprob_threshold=-1.0,            # Skip low confidence segments (lower = more aggressive)
        compression_ratio_threshold=2.4    # Skip repetitive segments (higher = more aggressive)
    )
    
    # Example: Get current Whisper model information
    model_info = api.get_whisper_model_info()
    logger.info(f"Current Whisper model: {model_info['current_model']} on {model_info['device']}")
    logger.info(f"Available models: {model_info['available_models']}")
    
    # Show final configuration
    final_options = api.get_whisper_options()
    logger.info(f"Final Whisper options: {final_options}")
    
    listener_ground = api.create_radio_listener()
    listener_ground.start(frequency=140.950e6, modulation=0, encryption=0)
    listener_ground.register_message_callback(lambda recognized_text, unit_id, api=api, listener=listener_ground: on_message_received_ground(recognized_text, unit_id, api, listener))

    listener_tower = api.create_radio_listener()
    listener_tower.start(frequency=139.725e6, modulation=0, encryption=0)
    listener_tower.register_message_callback(lambda recognized_text, unit_id, api=api, listener=listener_tower: on_message_received_tower(recognized_text, unit_id, api, listener))
    
    api.run()