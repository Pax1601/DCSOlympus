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
def on_message_received(recognized_text: str, unit_id: str, api: API, listener: RadioListener):
    logger.info(f"Received message from {unit_id}: {recognized_text}")
    
    # Generate echo message
    echo_text = f"Echo: {recognized_text}"
    logger.info(f"Generating echo response: {echo_text}")
    
    try:
        # Generate audio using Kokoro TTS (now built into the API)
        audio_file = api.generate_audio_message(echo_text, voice="af_bella")
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
    
    listener = api.create_radio_listener()
    listener.start(frequency=251.000e6, modulation=0, encryption=0)
    listener.register_message_callback(lambda recognized_text, unit_id, api=api, listener=listener: on_message_received(recognized_text, unit_id, api, listener))
    
    api.auto_update_units = False

    api.run()