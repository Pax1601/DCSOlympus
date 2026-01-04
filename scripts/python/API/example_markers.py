from api import API, LatLng
import time

# Setup a logger for the module
import logging
logger = logging.getLogger("example_markers")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
# Prevent double logging by not propagating to parent loggers
logger.propagate = False

start_time = time.time()

def on_update(api: API):
    markers = api.update_markers()
    logger.info(f"Current Markers in Mission: {markers}")
    
    # If 10 seconds have passed, delete all markers
    # List markers not deleted yet
    to_delete = []
    for marker_id, marker_data in markers.items():
        if marker_data.get('deleted', False) == False:
            to_delete.append(marker_id)
    
    if time.time() - start_time > 10 and len(to_delete) > 0:
        for marker_id in to_delete:
            api.delete_marker(int(marker_id))
        logger.info("All markers deleted after 10 seconds.")

if __name__ == "__main__":
    api = API(load_kokoro=False, load_whisper=False)
    logger.info("API initialized")
    
    api.register_on_update_callback(on_update)
    
    # Get the mission bullseyes
    bullseyes = api.update_bullseyes()
    
    # Get the mission markers
    markers = api.update_markers()
    
    # Get the highest ID of existing markers
    highest_marker_id = 0
    for marker_id in markers:
        if int(marker_id) > highest_marker_id:
            highest_marker_id = int(marker_id)
    logger.info(f"Highest existing marker ID: {highest_marker_id}")
    
    # Create a marker for testing at a specific location. I choose the blue bullseye so that it is easy to find and theater independent.
    location = LatLng(bullseyes['2']['latitude'], bullseyes['2']['longitude'], 0)
    api.create_marker(highest_marker_id + 1, location, "This is a test marker")
        
    api.run()