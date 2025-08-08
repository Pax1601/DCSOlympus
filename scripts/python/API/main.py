from api import API
from kronos.kronos import Kronos

##############################################################################################
# Main entry point for the script. It registers the callbacks and starts the API.
##############################################################################################         
if __name__ == "__main__":
    # Initialize the API
    api = API()
    
    # Initialize Kronos with the API
    kronos = Kronos(api)
    
    # Register the callbacks
    api.register_on_startup_callback(kronos.on_startup)

    # Start the API, this will run forever until stopped
    api.run()
    
    