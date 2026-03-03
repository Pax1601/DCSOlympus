"""
Unit Radio Embark Plugin for DCS Olympus API.
"""

import asyncio
import sys
from pathlib import Path

# Add the API directory to the path so we can import the Plugin base class
api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from plugin_base import Plugin
from radio.radio_listener import RadioListener


class UnitRadioEmbark(Plugin):
    """
    UnitRadioEmbark plugin scaffold.
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        self.config = plugin_info.get("config", {})
        self.blue_embark_frequency_hz = self._read_frequency_hz("blue_embark_frequency_hz")
        self.red_embark_frequency_hz = self._read_frequency_hz("red_embark_frequency_hz")
        self.blue_modulation = self._read_modulation("blue_modulation", default=0)
        self.red_modulation = self._read_modulation("red_modulation", default=0)
        self.blue_encryption = int(self.config.get("blue_encryption", 0))
        self.red_encryption = int(self.config.get("red_encryption", 0))
        self.running = False
        self.paused = False

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

    def on_start(self, loop: asyncio.AbstractEventLoop) -> bool:
        try:
            self.running = True
            self.paused = False
            self.logger.info("Blue embark frequency (Hz): %s", self.blue_embark_frequency_hz)
            self.logger.info("Red embark frequency (Hz): %s", self.red_embark_frequency_hz)
            self.logger.info("Blue modulation: %s", self.blue_modulation)
            self.logger.info("Red modulation: %s", self.red_modulation)

            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'))
            self.blue_listener = self.api.create_radio_listener()
            self.red_listener = self.api.create_radio_listener()
            
            self.api.register_on_update_callback(self.on_update)

            self.blue_listener.coalition = "blue"
            self.red_listener.coalition = "red"

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
                
            self.blue_listener.register_message_callback(self.on_message_callback)
            self.red_listener.register_message_callback(self.on_message_callback)
            
            self.api.register_asyncio_coroutine(loop)
    
            self.logger.info("UnitRadioEmbark plugin started")
            return True
        except Exception as e:
            self.logger.error(f"Failed to start UnitRadioEmbark plugin: {e}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            self.running = False

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
            self.paused = True
            self.logger.info("UnitRadioEmbark plugin paused")
            return True
        except Exception as e:
            self.logger.error(f"Failed to pause UnitRadioEmbark plugin: {e}", exc_info=True)
            return False

    def on_resume(self) -> bool:
        try:
            self.paused = False
            self.logger.info("UnitRadioEmbark plugin resumed")
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume UnitRadioEmbark plugin: {e}", exc_info=True)
            return False
        
    def on_message_callback(self, message, unitID):
        self.logger.info(f"Received radio message: {message}")
        
    def on_update(self, api: API):
        self.watchdog_tick()