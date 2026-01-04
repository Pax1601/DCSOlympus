from api import API

# Setup a logger for the module
import logging
logger = logging.getLogger("send_ATC_message_as")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
# Prevent double logging by not propagating to parent loggers
logger.propagate = False

waiting_for_input = False
last_message = "No message"
    
def generate_text(text, listener, unit_ID): 
    try:
        # Generate audio using Kokoro TTS (now built into the API)
        audio_file = api.generate_audio_message(text, voice="bm_daniel")
        logger.info(f"Generated audio file: {audio_file}")
        
        # Transmit the audio back on the same frequency
        success = listener.transmit_on_frequency(
            file_name=audio_file,
            frequency=listener.frequency,
            modulation=listener.modulation,
            encryption=listener.encryption,
            unit_ID = unit_ID
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

def get_new_user_input(api, unit_ID, listener):
    global waiting_for_input, last_message
    if waiting_for_input:
        return
    
    waiting_for_input = True
    # User input prompts - keeping as print for console interaction
    print("Enter text to send, enter to resend last message:")
    text = input()

    if len(text) == 0:
        text = last_message
    
    last_message = text
    generate_text(text, listener, unit_ID)
    waiting_for_input = False
     
if __name__ == "__main__":
    api = API()
    logger.info("API initialized")

    print("Enter frequency [MHz]:")
    freq = float(input())

    print("Enter unit ID:")
    # Wait for the user to type the unit_ID of the unit to impersonate
    unit_ID = int(input())

    listener = api.create_radio_listener()
    listener.start(frequency=freq * 1e6, modulation=0, encryption=0)

    api.register_on_update_callback(lambda api=api, unit_ID=unit_ID, listener=listener: get_new_user_input(api, unit_ID, listener))

    api.run()