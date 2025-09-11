from api import API

def on_api_startup(api: API):
    units = api.update_units()
    for unit in units.values():
        if unit.name == "Infantry AK Ins":
            current_pos = unit.position
            next_pos = current_pos.project_with_bearing_and_distance(20, 0)  # Move 20 meters north
            next_pos.threshold = 2 # Set threshold to 1 meter, very precise
            unit.set_path([next_pos])

##############################################################################################
# Main entry point for the script. It registers the callbacks and starts the API.
##############################################################################################         
if __name__ == "__main__":
    # Initialize the API
    api = API()
    
    # Register the callbacks
    api.register_on_startup_callback(on_api_startup)

    # Start the API, this will run forever until stopped
    api.run()
    