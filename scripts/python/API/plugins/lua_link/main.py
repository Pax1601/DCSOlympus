"""
LuaLink plugin for DCS Olympus API.
"""

import re
import sys
from pathlib import Path
import time

from data.data_types import LatLng
from radio.radio_listener import RadioListener
from unit.unit import Unit

api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from plugin_base import Plugin
from api import API
from utils.utils import lua_table_file_to_dict, dict_to_lua_table_file

class LuaLink(Plugin):
    """
    LuaLink plugin.
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        self.config = global_config.get("plugin_settings", {}).get(plugin_info.get("name"), {})
        self.active_lua_config = self.config.get("active_lua_config", "config.lua")

        self.bases_data = {}

        self.listeners: list[RadioListener] = []
        self.api: API | None = None

        self.session_hash = None
        self.start_time = None
        self.mission_started = False

    def on_start(self) -> bool:
        """
        Called when the plugin should start its operation.
        
        Returns:
            bool: True if started successfully, False otherwise
        """

        self.mission_started = False

        # Clean up old command files
        commands_dir = Path(__file__).parent / "lua" / "commands"
        if commands_dir.exists() and commands_dir.is_dir():
            for command_file in commands_dir.iterdir():
                if command_file.is_file():
                    command_file.unlink()

        # Initialize the API if not already done
        if self.api is None:
            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'), load_kokoro=True, load_whisper=True)
        
        self.api.register_on_update_callback(lambda api: self.on_api_update(api))
        self.api.run()

        self.logger.info("LuaLink plugin started")
        return True
    
    def check_mission_started(self):
        result = self.api.update_mission()
        if not result or result['dateAndTime']['elapsedTime'] < 30:
            return False
        return True
    
    def initialize_lua(self):
        # Load all the lua files
        self.api.execute_file(str(Path(__file__).parent / "lua" / "init.lua"))
        self.api.execute_file(self.active_lua_config)
        self.api.execute_file(str(Path(__file__).parent / "lua" / "constants.lua"))
        self.api.execute_file(str(Path(__file__).parent / "lua" / "utils.lua"))
        self.api.execute_file(str(Path(__file__).parent / "lua" / "functions.lua"))
        self.api.execute_file(str(Path(__file__).parent / "lua" / "main.lua"))
        
        # Read the configuration file
        self.bases_data = lua_table_file_to_dict(self.active_lua_config)
        
        for base_name, base_info in self.bases_data.items():
            self.logger.info("Frequency (Hz): %s", base_info["frequency"])
            self.logger.info("Kokoro voice model: %s", base_info["voiceModel"])
            self.logger.info("Modulation: %s", base_info["modulation"])

            if base_info["frequency"] is not None and base_info["modulation"] is not None:
                listener = self.api.create_radio_listener()
                listener.start(
                    frequency=base_info["frequency"],
                    modulation=base_info["modulation"],
                    encryption=0,
                )
                
                listener.register_message_callback(lambda message, unitID, listener=listener, base_name=base_name: self.on_message_callback(message, unitID, listener, base_name))
                self.listeners.append(listener)

                listener.set_prompt(f"Possible commands are: status report, fire team, fuel, ammo, explosives, smoke, supplies, clear. Over.")
            else:
                self.logger.warning("Skipping base %s due to invalid configuration", base_name)

    def on_api_update(self, api: API):
        # Watchdog to ensure the plugin is running and responsive
        self.watchdog_tick()

        # Check if the mission has started, if not don't do anything to avoid potential issues with the Lua script trying to read config values before they are set for the first time
        if not self.mission_started:
            if self.check_mission_started():
                self.logger.info("Mission has started, initializing lua")
                self.mission_started = True
                self.initialize_lua()
                self.start_time = time.time()
            else:
                return  # Don't do anything
        
        # Get the custom mission data from the API 
        result = self.api.update_custom_mission_data("luaLink")

        # Save the current supply and fuel levels for each base to the config file for the Lua script to read and use in its logic
        if "customData" in result and result["customData"] is not None:
            # Check if at least 10 seconds have passed since the mission started to avoid overwriting the initial config values before the Lua script has a chance to read them
            if self.start_time is not None and time.time() - self.start_time < 10:
                return

            custom_data = result["customData"]
            self.bases_data = custom_data

            # Perform periodic functions
            if result.get("load") < 10:  # Only perform these functions if the server load is less than 100% to avoid potential performance issues
                self.send_units_to_spawn_point()
                self.rearm_artillery_pieces()

            # Write the custom data to the link file for the Lua script to read
            dict_to_lua_table_file(custom_data, self.active_lua_config, "olyLink.bases")
       
    def on_stop(self) -> bool:
        """
        Called when the plugin should stop its operation.
        
        Returns:
            bool: True if stopped successfully, False otherwise
        """
        try:
            for listener in self.listeners:
                listener.stop()

            self.api.stop()
            self.api = None

            self.logger.info(f"LuaLink plugin stopped")
        except Exception as e:
            self.logger.error(f"Failed to stop LuaLink plugin: {e}", exc_info=True)
            return False

        return True

    def on_pause(self) -> bool:
        """
        Called when the plugin should pause its operation.
        
        Returns:
            bool: True if paused successfully, False otherwise
        """
        self.logger.info(f"LuaLink plugin paused")
        return True

    def on_resume(self) -> bool:
        """
        Called when the plugin should resume from pause.
        
        Returns:
            bool: True if resumed successfully, False otherwise
        """
        self.logger.info(f"LuaLink plugin resumed")
        return True
    
    def on_message_callback(self, message, unitID, listener: RadioListener, base_name: str):
        self.logger.info(f"Received radio message: {message}")
        normalized_message = message.lower()

        fireteam_keywords = ["fire", "team"]
        status_keywords = ["status", "report", "situation", "sitrep"]
        
        fuel_keywords = ["fuel"]
        ammo_keywords = ["ammo", "munition"]
        explosives_keywords = ["explosive", "HE"]
        smoke_keywords = ["smoke"]
        supplies_keywords = ["supplies", "resupply"]
        clear_keywords = ["clear"]

        units = self.api.get_units()
        if unitID not in units:
            self.logger.warning(f"UnitID {unitID} not found in game units.")
            return
        
        unit = units[unitID]
        
        keep_message = False
        if any(keyword in normalized_message for keyword in status_keywords):
            self.logger.info(f"Unit {unitID} requesting status report.")
            response = self.status_report(unit, base_name)
        elif any(keyword in normalized_message for keyword in fireteam_keywords):
            self.logger.info(f"Unit {unitID} requesting fire team.")
            response = self.fireteam(unit, base_name)  
        elif any(keyword in normalized_message for keyword in fuel_keywords):
            self.logger.info(f"Unit {unitID} requesting fuel.")
            response = self.fuel(unit, base_name)
        elif any(keyword in normalized_message for keyword in ammo_keywords):
            self.logger.info(f"Unit {unitID} requesting ammo.")
            response = self.ammo(unit, base_name)
        elif any(keyword in normalized_message for keyword in explosives_keywords):
            self.logger.info(f"Unit {unitID} requesting explosives.")
            response = self.explosives(unit, base_name)
        elif any(keyword in normalized_message for keyword in smoke_keywords):
            self.logger.info(f"Unit {unitID} requesting smoke.")
            response = self.smoke(unit, base_name)
        elif any(keyword in normalized_message for keyword in supplies_keywords):
            self.logger.info(f"Unit {unitID} requesting supplies.")
            response = self.supplies(unit, base_name)
        elif any(keyword in normalized_message for keyword in clear_keywords):
            self.logger.info(f"Unit {unitID} requesting clear.")
            response = self.clear(unit, base_name)
        else:
            response = "Say again. Over."
            keep_message = True  # Keep the message for debugging unrecognized commands
            
        voice_model = self.bases_data[base_name]["voiceModel"] if base_name in self.bases_data and "voiceModel" in self.bases_data[base_name] else None
        future = self.api.generate_audio_message_in_executor(response, voice=voice_model)
        future.add_done_callback(lambda audio_file: listener.transmit_on_frequency(file_name=audio_file.result()))

        return keep_message
    
    def status_report(self, unit: Unit, base_name: str):
        return f"{unit.callsign}, base logistics, current base situation is as follows. " \
               f"We currently have {self.bases_data[base_name]['fuel']} liters of fuel, " \
               f"{self.bases_data[base_name]['shells']} artillery shells, " \
               f"{self.bases_data[base_name]['supplies']} kilograms of supplies, and " \
               f"{self.bases_data[base_name]['troopsAvailable']} troops available. Over."
                
    def fireteam(self, unit: Unit, base_name: str):
        # Check how many troops we have available at the base
        troopsAvailable = max(0, self.bases_data[base_name].get("troopsAvailable", 0) - 8) 

        # Check if we have enought supplies
        required_supplies = self.bases_data[base_name].get("suppliesPerTroop", 0) * 8

        if troopsAvailable <= 0:
            return f"{unit.callsign}, base logistics, no troops available at the barracks. Over."
        elif self.bases_data[base_name].get("supplies", 0) < required_supplies:
            return f"{unit.callsign}, base logistics, we don't have enough supplies to send a fire team right now. Over."
        else:
            self.execute_command(f"olyLink.spawnFireTeam(\"{base_name}\")") 
            return f"{unit.callsign}, base logistics, we're getting a fire team ready for you. Over."
    
    def fuel(self, unit: Unit, base_name: str):
        self.execute_command(f"olyLink.spawnFuelBarrel(\"{base_name}\")")
        return f"{unit.callsign}, base logistics, we're getting some fuel ready for you. Over."
    
    def ammo(self, unit: Unit, base_name: str):
        self.execute_command(f"olyLink.spawnShellCrate(\"{base_name}\")")
        return f"{unit.callsign}, base logistics, we're getting some shells ready for you. Over."
    
    def explosives(self, unit: Unit, base_name: str):
        self.execute_command(f"olyLink.spawnWeaponCrate(\"{base_name}\", 'RocketHE')")
        return f"{unit.callsign}, base logistics, we're getting some H E rockets ready for you. Over."
    
    def smoke(self, unit: Unit, base_name: str):
        self.execute_command(f"olyLink.spawnWeaponCrate(\"{base_name}\", 'RocketOther')")
        return f"{unit.callsign}, base logistics, we're getting some smoke rockets ready for you. Over."
    
    def supplies(self, unit: Unit, base_name: str):
        self.execute_command(f"olyLink.spawnSupplyCrate(\"{base_name}\")")
        return f"{unit.callsign}, base logistics, we're getting some supplies ready for you. Over."
    
    def clear(self, unit: Unit, base_name: str):
        self.execute_command(f"olyLink.clearBasePickupZones(\"{base_name}\")")
        return f"{unit.callsign}, base logistics, we're clearing the pickup zones for you. Over."
    
    def execute_command(self, command: str):
        # Create a tmp file with the command for the Lua script to read and execute
        # Use a random filename
        random_filename = f"command_{int(time.time() * 1000)}.lua"

        # Create the commands directory if it doesn't exist
        if not (Path(__file__).parent / "lua" / "commands").exists():
            (Path(__file__).parent / "lua" / "commands").mkdir(parents=True)

        # Save the command string
        command_file = Path(__file__).parent / "lua" / "commands" / random_filename
        command_file.write_text(command)

        # Execute the Lua command file  
        self.api.execute_file(str(command_file))

    def send_units_to_spawn_point(self):
        # Iterate on all the bases
        for base_name, base_info in self.bases_data.items():
            # Iterate on all the zones
            zones = self.api.get_mission().get("triggers", {})
            for zone in zones.values():
                if "name" in zone and zone["name"] == base_info.get("fireTeamZoneName", ""):
                    spawn_location = zone.get("location", {})
                    spawn_radius = zone.get("radius", 50)     
                    spawn_latlng = LatLng(spawn_location.get("lat", 0), spawn_location.get("lng", 0), spawn_location.get("alt", 0))

                    # Get all the units in the mission that are within 200 meters of the spawn point BUT are outside it
                    # Also check that the unit is an infantry unit, belongs to the blue coalition, is idle and is controlled by Olympus
                    units = self.api.get_units()
                    for unit in units.values():
                        if unit.category == "GroundUnit":
                            unit_type = self.api.groundunit_database.get(unit.name, {}).get("type", "")
                            if spawn_latlng.distance_to(unit.position) <= 200 and spawn_latlng.distance_to(unit.position) > spawn_radius and unit_type == "Infantry" and unit.coalition == "blue" and unit.state == "idle" and unit.controlled and unit.alive:
                                self.logger.info(f"Unit {unit.ID} is nearby the spawn point of base {base_name}, sending it to the spawn point")
                                unit.set_path([spawn_latlng])
                                unit.register_on_destination_reached_callback(lambda unit, reached, base_name=base_name: self.on_unit_destination_reached(unit, base_name), destination=spawn_latlng, threshold=spawn_radius)

    def on_unit_destination_reached(self, unit: Unit, base_name: str):
        self.logger.info(f"Unit {unit.ID} has reached the spawn point of base {base_name}")
        unit.delete_unit()

        # Notify the Lua script that the unit has reached its destination so it can update the number of available troops at the base
        self.execute_command(f"olyLink.onFireTeamUnitReachedDestination(\"{base_name}\")")

    def rearm_artillery_pieces(self):
        # Iterate on all the bases
        for base_name, base_info in self.bases_data.items():
            required_shells = self.bases_data[base_name].get("shellsPerArtilleryPiece", 0)
            available_shells = self.bases_data[base_name].get("shells", 0)

            # Iterate on all the zones
            zones = self.api.get_mission().get("triggers", {})
            for zone in zones.values():
                if "name" in zone and zone["name"] == base_info.get("dropoffZoneName", ""):
                    dropoff_location = zone.get("location", {})
                    dropoff_latlng = LatLng(dropoff_location.get("lat", 0), dropoff_location.get("lng", 0), dropoff_location.get("alt", 0), threshold=30)
                    

                    # Get all the units in the mission that are within 200 meters the dropoff point
                    units = self.api.get_units()
                    for unit in units.values():
                        if unit.category == "GroundUnit":
                            if available_shells < required_shells:
                                self.logger.debug(f"Not enough shells available to rearm unit {unit.ID} at base {base_name}, skipping")
                                continue

                            unit_type = self.api.groundunit_database.get(unit.name, {}).get("type", "")
                            if dropoff_latlng.distance_to(unit.position) <= 200 and unit_type == "Artillery" and unit.coalition == "blue" and unit.alive:
                                # Check if the unit needs rearming
                                if unit.total_ammo <= 0.1 * unit.max_ammo:
                                    self.logger.info(f"Unit {unit.ID} is nearby base {base_name} and needs rearming, rearming it")
                                    
                                    # Clone the original unit to reset its ammo
                                    self.api.clone_units([{"ID": unit.ID, "location": {
                                        "lat": unit.position.lat,
                                        "lng": unit.position.lng,
                                        "alt": unit.position.alt
                                    }}], delete_original=True)

                                    # Update the value of available shells
                                    self.execute_command(f"olyLink.rearmArtilleryPiece(\"{base_name}\")")

                                    # Decrease the available shells by the required shells to rearm one artillery piece
                                    available_shells -= required_shells


