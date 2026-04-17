"""
Unit Radio Embark Plugin for DCS Olympus API.
"""

import asyncio
import json
import sys
from pathlib import Path
import os

from requests import Response

from unit.unit import Unit

# Add the API directory to the path so we can import the Plugin base class
api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from plugin_base import Plugin
from radio.radio_listener import RadioListener


class UnitRadioEmbark(Plugin):
    """
    UnitRadioEmbark plugin.
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        self.config = global_config.get("plugin_settings", {}).get(plugin_info.get("name"), {})
        self.blue_embark_frequency_hz = self._read_frequency_hz("blue_embark_frequency_hz")
        self.red_embark_frequency_hz = self._read_frequency_hz("red_embark_frequency_hz")
        self.kokoro_voice_model = self._read_voice_model("kokoro_voice_model", default="bm_daniel")
        self.blue_modulation = self._read_modulation("blue_modulation", default=0)
        self.red_modulation = self._read_modulation("red_modulation", default=0)
        self.blue_encryption = int(self.config.get("blue_encryption", 0))
        self.red_encryption = int(self.config.get("red_encryption", 0))

        self.api: API | None = None  # Will be set when the plugin is started
        self.blue_listener: RadioListener | None = None
        self.red_listener: RadioListener | None = None

    def _read_frequency_hz(self, key: str):
        value = self.config.get(key)
        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            self.logger.warning("Invalid frequency value for %s: %s", key, value)
            return None

    def _read_modulation(self, key: str, default: int = 0) -> int:
        value = self.config.get(key, default)
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
        try:
            self.logger.info("Blue embark frequency (Hz): %s", self.blue_embark_frequency_hz)
            self.logger.info("Red embark frequency (Hz): %s", self.red_embark_frequency_hz)
            self.logger.info("Kokoro voice model: %s", self.kokoro_voice_model)
            self.logger.info("Blue modulation: %s", self.blue_modulation)
            self.logger.info("Red modulation: %s", self.red_modulation)

            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'))
            self.blue_listener = self.api.create_radio_listener()
            self.red_listener = self.api.create_radio_listener()
            
            self.blue_listener.set_coalition("blue")
            self.red_listener.set_coalition("red")
            
            prompt = "Checking for unit embarking or disembarking."
            
            self.blue_listener.set_prompt(prompt)
            self.red_listener.set_prompt(prompt)
            
            self.api.register_on_update_callback(self.on_update)

            if self.blue_embark_frequency_hz is not None:
                self.blue_listener.start(
                    frequency=self.blue_embark_frequency_hz,
                    modulation=self.blue_modulation,
                    encryption=self.blue_encryption,
                )

            if self.red_embark_frequency_hz is not None:
                self.red_listener.start(
                    frequency=self.red_embark_frequency_hz,
                    modulation=self.red_modulation,
                    encryption=self.red_encryption,
                )
                
            self.blue_listener.register_message_callback(lambda message, unitID, listener=self.blue_listener: self.on_message_callback(message, unitID, listener))
            self.red_listener.register_message_callback(lambda message, unitID, listener=self.red_listener: self.on_message_callback(message, unitID, listener))
            
            self.api.run()
    
            self.logger.info("UnitRadioEmbark plugin started")
            return True
        except Exception as e:
            self.logger.error(f"Failed to start UnitRadioEmbark plugin: {e}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            if self.blue_listener:
                self.blue_listener.stop()
                self.blue_listener = None

            if self.red_listener:
                self.red_listener.stop()
                self.red_listener = None

            self.api.stop()
            self.api = None

            self.logger.info("UnitRadioEmbark plugin stopped")
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop UnitRadioEmbark plugin: {e}", exc_info=True)
            return False

    def on_pause(self) -> bool:
        try:
            self.logger.info("UnitRadioEmbark plugin paused")
            # TODO
            return True
        except Exception as e:
            self.logger.error(f"Failed to pause UnitRadioEmbark plugin: {e}", exc_info=True)
            return False

    def on_resume(self) -> bool:
        try:
            self.logger.info("UnitRadioEmbark plugin resumed")
            # TODO
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume UnitRadioEmbark plugin: {e}", exc_info=True)
            return False
        
    def on_update(self, api: API):
        self.watchdog_tick()
        
    def on_message_callback(self, message: str, unitID, listener: RadioListener):
        self.logger.info(f"Received radio message: {message}")
        normalized_message = message.lower()

        disembark_keywords = ["disembark", "get off", "unload", "get out", "leave", "drop off"]
        embark_keywords = ["embark", "get on", "board", "load", "get in"]
        smoke_keywords = ["smoke"]
        move_keywords = ["move", "group"]
        pickup_keywords = ["pickup", "pick up"]
        
        units = self.api.get_units()
        
        if unitID not in units:
            self.logger.warning(f"UnitID {unitID} not found in game units.")
            return
        
        unit = units[unitID]
        
        if any(keyword in normalized_message for keyword in disembark_keywords):
            self.logger.info(f"Unit {unitID} requesting disembarking.")
            response = self.disembark_units(unit)
        elif any(keyword in normalized_message for keyword in embark_keywords):
            self.logger.info(f"Unit {unitID} requesting embarking.")
            response = self.embark_units(unit)
        elif any(keyword in normalized_message for keyword in smoke_keywords):
            self.logger.info(f"Unit {unitID} requesting smoke.")
            response = self.smoke_pickup_point(unit)
        elif any(keyword in normalized_message for keyword in move_keywords):
            self.logger.info(f"Unit {unitID} requesting move to pickup point.")
            response = self.move_to_pickup_point(unit)
        elif any(keyword in normalized_message for keyword in pickup_keywords):
            self.logger.info(f"Unit {unitID} requesting pickup point.")
            response = self.set_pickup_point(unit)
        else:
            response = "I did not understand your request sir."

        future = self.api.generate_audio_message_in_executor(response, voice=self.kokoro_voice_model)
        future.add_done_callback(lambda f: listener.transmit_on_frequency(file_name=f.result()))
                    
    def embark_units(self, unit: Unit):
        self.logger.info(f"Embarking units for unitID {unit.ID}")
        
        if (not unit.can_transport_units):
            self.logger.warning(f"UnitID {unit.ID} cannot transport units.")
            response = "You cannot embark units on this unit sir."
            return response
        
        if (unit.airborne):
            self.logger.warning(f"UnitID {unit.ID} is airborne and cannot embark units.")
            response = "You cannot embark units while airborne sir."
            return response
        
        if (unit.speed > 2):
            self.logger.warning(f"UnitID {unit.ID} is moving at speed {unit.speed} and cannot embark units.")
            response = "You need to be stationary to embark units sir."
            return response
        
        if (not unit.alive):
            self.logger.warning(f"UnitID {unit.ID} is not alive and cannot embark units.")
            response = "You cannot embark units on a destroyed unit sir."
            return response
        
        if (len(unit.on_board_units_IDs) >= unit.maximum_transportable_units):
            self.logger.warning(f"UnitID {unit.ID} is already at maximum capacity and cannot embark more units.")
            response = "You cannot embark more units on this unit sir, it is already at maximum capacity."
            return response
        
        return self.extract_response(unit.embark_nearby_units())
        
    def disembark_units(self, unit: Unit):
        self.logger.info(f"Disembarking units for unitID {unit.ID}")

        if (len(unit.on_board_units_IDs) == 0):
            self.logger.warning(f"UnitID {unit.ID} has no units on board to disembark.")
            response = "You have no units on board to disembark sir."
            return response
        
        if (not unit.alive):
            self.logger.warning(f"UnitID {unit.ID} is not alive and cannot disembark units.")
            response = "You cannot disembark units from a destroyed unit sir."
            return response
        
        if (unit.airborne):
            self.logger.warning(f"UnitID {unit.ID} is airborne and cannot disembark units.")
            response = "You cannot disembark units while airborne sir."
            return response
        
        if (unit.speed > 2):
            self.logger.warning(f"UnitID {unit.ID} is moving at speed {unit.speed} and cannot disembark units.")
            response = "You need to be stationary to disembark units sir."
            return response
        
        return self.extract_response(unit.disembark_units())
        
    def smoke_pickup_point(self, unit: Unit):
        self.logger.info(f"Smokig pickup point for unitID {unit.ID}")
        return self.extract_response(unit.smoke_pickup_location())
        
    def move_to_pickup_point(self, unit: Unit):
        self.logger.info(f"Moving units to pickup point for unitID {unit.ID}")
        return self.extract_response(unit.move_to_pickup_location())
               
    def set_pickup_point(self, unit: Unit):
        self.logger.info(f"Setting pickup point for unitID {unit.ID}")
        return self.extract_response(unit.set_pickup_location(unit.position))
    
    def extract_response(self, response: Response):
        json_response = response.content.decode('utf-8') if isinstance(response.content, bytes) else str(response.content)
        dict_response = json.loads(json_response)
        return dict_response.get("response", "Command executed sir.")