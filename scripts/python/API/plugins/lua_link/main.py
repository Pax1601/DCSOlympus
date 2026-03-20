"""
LuaLink plugin for DCS Olympus API.
"""

import re
import sys
from pathlib import Path

from radio.radio_listener import RadioListener
from unit.unit import Unit

api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from plugin_base import Plugin
from api import API

class LuaLink(Plugin):
    """
    LuaLink plugin.
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        self.config = plugin_info.get("config", {})

        self.bases = self._read_bases()
        self.kokoro_voice_model = self._read_voice_model("kokoro_voice_model", default="bm_daniel")
        self.link_file_path = self.config.get("link_file_path", "olympus_link_data.txt")

        self.listeners: list[RadioListener] = []
        self.api: API | None = None

    def _read_bases(self, key: str = "bases") -> dict:
        bases_config = self.config.get(key, {})
        if not isinstance(bases_config, dict):
            self.logger.warning("Invalid bases configuration: expected a dictionary, got %s", type(bases_config).__name__)
            return {}

        valid_bases = {}
        for base_name, base_info in bases_config.items():
            if not isinstance(base_info, dict):
                self.logger.warning("Invalid base info for %s: expected a dictionary, got %s", base_name, type(base_info).__name__)
                continue

            frequency_hz = self._read_frequency_hz(base_info, "frequency_hz")
            modulation = self._read_modulation(base_info, "modulation", default=0)
            encryption = 0  # Currently not used, but can be added in the future if needed

            if frequency_hz is not None:
                valid_bases[base_name] = {
                    "frequency_hz": frequency_hz,
                    "modulation": modulation,
                    "encryption": encryption,
                }
            else:
                self.logger.warning("Base %s is missing a valid frequency_hz and will be skipped", base_name)

        return valid_bases

    def _read_frequency_hz(self, base_info: dict, key: str):
        value = base_info.get(key)
        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            self.logger.warning("Invalid frequency value for %s: %s", key, value)
            return None
        
    def _read_modulation(self, base_info: dict, key: str, default: int = 0) -> int:
        value = base_info.get(key, default)
        try:
            return int(value)
        except (TypeError, ValueError):
            self.logger.warning("Invalid modulation value for %s: %s", key, value)
            return default

    def _read_voice_model(self, key: str, default: str = "bm_daniel") -> str:
        value = self.config.get(key, default)
        if value is None:
            return default

        voice_model = str(value).strip()
        if not voice_model:
            self.logger.warning("Invalid voice model for %s: %s", key, value)
            return default

        return voice_model

    def on_start(self) -> bool:
        """
        Called when the plugin should start its operation.
        
        Returns:
            bool: True if started successfully, False otherwise
        """

        self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'))
        
        for base_name, base_info in self.bases.items():
            self.logger.info("Frequency (Hz): %s", base_info["frequency_hz"])
            self.logger.info("Kokoro voice model: %s", self.kokoro_voice_model)
            self.logger.info("Modulation: %s", base_info["modulation"])

            if base_info["frequency_hz"] is not None and base_info["modulation"] is not None:
                listener = self.api.create_radio_listener()
                listener.start(
                    frequency=base_info["frequency_hz"],
                    modulation=base_info["modulation"],
                    encryption=0,
                )
                
                listener.register_message_callback(lambda message, unitID, listener=listener, base_name=base_name: self.on_message_callback(message, unitID, listener, base_name))
                self.listeners.append(listener)

                # TODO prompt = "Listening for ."
        
                # TODO self.listener.set_prompt(prompt)
            else:
                self.logger.warning("Skipping base %s due to invalid configuration", base_name)

        self.api.register_on_update_callback(lambda api: self.watchdog_tick())
        self.api.run()

        self.api.execute_file(str(Path(__file__).parent / "lua" / "link.lua"))

        self.logger.info("LuaLink plugin started")
        return True

    def on_stop(self) -> bool:
        """
        Called when the plugin should stop.
        
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

        fireteam_keywords = ["fire team"]
        status_keywords = ["status", "report", "situation", "sitch", "sitrep"]
        
        fuel_keywords = ["fuel"]
        ammo_keywords = ["ammo", "munitions"]
        explosives_keywords = ["explosive", "rockets"]
        smoke_keywords = ["smoke"]
        supplies_keywords = ["supplies", "resupply", "logistics"]
        clear_keywords = ["clear"]

        units = self.api.get_units()
        
        if unitID not in units:
            self.logger.warning(f"UnitID {unitID} not found in game units.")
            return
        
        unit = units[unitID]
        
        keep_message = False
        if any(keyword in normalized_message for keyword in fireteam_keywords):
            self.logger.info(f"Unit {unitID} requesting fire team.")
            response = self.fireteam(unit, base_name)
        elif any(keyword in normalized_message for keyword in status_keywords):
            self.logger.info(f"Unit {unitID} requesting status report.")
            response = self.status_report(unit, base_name)
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
            response = "I did not understand your request sir."
            keep_message = True  # Keep the message for debugging unrecognized commands
            
        message_filename = self.api.generate_audio_message(response, voice=self.kokoro_voice_model)
        listener.transmit_on_frequency(message_filename, listener.frequency, listener.modulation, listener.encryption)
        return keep_message
                
    def fireteam(self, unit: Unit, base_name: str):
        self._ammend_file_command("troops", base_name)
        return f"{unit.callsign}, a fire team is being deployed"
    
    def status_report(self, unit: Unit, base_name: str):
        current_values = self._read_data_from_file()
        troop_deployed = re.search(r"<troopDeployed>(.*?)</troopDeployed>", current_values, re.S)
        troop_deployed_value = int(round(float(troop_deployed.group(1)))) if troop_deployed else 0
        base_blocks = re.findall(r"<base>(.*?)</base>", current_values, re.S)
        base_block = next((block for block in base_blocks if base_name.lower() in block.lower()), base_blocks[0] if base_blocks else "")
        fuel_match = re.search(r"<liquid>(.*?)</liquid>", base_block, re.S) if base_block else None
        fuel_value = int(round(float(fuel_match.group(1)))) if fuel_match else 0
        supplies_match = re.search(r"<supplies>(.*?)</supplies>", base_block, re.S) if base_block else None
        supplies_value = int(round(float(supplies_match.group(1)))) if supplies_match else 0        
        # TODO put back troop cap
        return f"{unit.callsign}, command, current base status is fuel {fuel_value} kilograms, supplies {supplies_value} kilograms, and we have {troop_deployed_value} infantry deployed in the field currently out."
 
    def fuel(self, unit: Unit, base_name: str):
        self._ammend_file_command("fuel", base_name)
        return f"{unit.callsign}, base logistics, we're getting some fuel ready for you at the tanker."
    
    def ammo(self, unit: Unit, base_name: str):
        self._ammend_file_command("ammoGuns", base_name)
        return f"{unit.callsign}, base logistics, we're getting some ammo ready for you at the cargo ship."
    
    def explosives(self, unit: Unit, base_name: str):
        self._ammend_file_command("HE", base_name)
        return f"{unit.callsign}, base logistics, we're getting some H E rockets ready for you at the cargo ship."
    
    def smoke(self, unit: Unit, base_name: str):
        self._ammend_file_command("SM", base_name)
        return f"{unit.callsign}, base logistics, we're getting some smoke and illumination rockets ready for you at the cargo ship."
    
    def supplies(self, unit: Unit, base_name: str):
        self._ammend_file_command("supplies", base_name)
        return f"{unit.callsign}, base logistics, we're getting some supplies ready for you at the cargo ship."
    
    def clear(self, unit: Unit, base_name: str):
        self._ammend_file_command("clear", base_name)
        return f"{unit.callsign}, we are clearing the cargo areas for you now."
    
    def _ammend_file_command(self, command_type: str, base_name: str):
        try:
            with open(self.link_file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            self.logger.error(f"Failed to read link file: {e}", exc_info=True)
            return

        match = re.search(r"(<commandToLua>)(.*?)(</commandToLua>)", content, re.S)
        if not match:
            self.logger.warning("No <commandToLua> block found in Olympus link file")
            return

        def set_tag(block: str, tag: str, value: str) -> str:
            pattern = rf"(<{tag}>)(.*?)(</{tag}>)"
            if re.search(pattern, block, re.S):
                return re.sub(pattern, rf"\1{value}\3", block, flags=re.S)
            return block + f"  <{tag}>{value}</{tag}>\n"

        block = match.group(1) + match.group(2) + match.group(3)
        if command_type == "fuel":
            block = set_tag(block, "order", "Spawn Fuel")
        elif command_type == "HE":
            block = set_tag(block, "order", "Spawn Rocket HE")
        elif command_type == "SM":
            block = set_tag(block, "order", "Spawn Rocket SMIL")
        elif command_type == "ammoGuns":
            block = set_tag(block, "order", "Spawn Ammo")
        elif command_type == "supplies":
            block = set_tag(block, "order", "Spawn Supplies")
        elif command_type == "clear":
            block = set_tag(block, "order", "Clear Area")
        elif command_type == "troops":
            block = set_tag(block, "order", "Troops created")
        else:
            block = set_tag(block, "order", "Spawn Supplies")

        block = set_tag(block, "read", "false")
        block = set_tag(block, "base", base_name)

        new_content = content[: match.start()] + block + content[match.end() :]
        try:
            with open(self.link_file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
        except Exception as e:
            self.logger.error(f"Failed to write link file: {e}", exc_info=True)

    def _read_data_from_file(self) -> str:
        try:
            with open(self.link_file_path, "r", encoding="utf-8") as f:
                content = f.read()
                return content
        except Exception as e:
            self.logger.error(f"Error reading from file: {e}")
            return ""