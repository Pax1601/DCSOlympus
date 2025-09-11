from api import API

def on_api_startup(api: API):
    units = api.update_units()
    for unit in units.values():
        if unit.name == "UH-1H":
            # Set cargo weight to 5000 kg
            unit.set_cargo_weight(5000.0)

def on_api_update(api: API):
    units = api.get_units()
    for unit in units.values():
        if unit.name == "UH-1H":
            print(f"Cargo Weight for {unit.name}: {unit.cargo_weight} kg")

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
    