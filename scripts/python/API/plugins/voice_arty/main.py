"""
Voice-controlled artillery plugin for DCS Olympus API.
"""

import asyncio
import os
import re
import sys
from pathlib import Path

api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from plugin_base import Plugin
try:
    from .mgrs_utils import extract_mgrs_100k, format_grid_for_readback, mgrs_100k_to_latlng
except ImportError:
    from mgrs_utils import extract_mgrs_100k, format_grid_for_readback, mgrs_100k_to_latlng


class VoiceArty(Plugin):
    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)

        self.config = plugin_info.get("config", {})
        self.update_interval = float(self.config.get("update_interval", 1.0))
        self.frequency = float(self.config.get("frequency_hz", 33.000e6))
        self.modulation = int(self.config.get("modulation", 1))
        self.encryption = int(self.config.get("encryption", 0))
        self.voice = str(self.config.get("voice", "am_michael"))
        self.friendly_coalition = str(self.config.get("friendly_coalition", "blue"))
        self.artillery_reference_name = str(self.config.get("artillery_reference_name", "L118_Unit"))
        self.artillery_fire_unit_name = str(self.config.get("artillery_fire_unit_name", "L118_Unit"))

        self.api = None
        self.listener = None
        self.running = False
        self.paused = False
        self.state_by_unit = {}
        self.intent_token_map = {
            "5": "fire",
            "five": "fire",
            "for": "for",
            "four": "for",
            "fore": "for",
            "affect": "effect",
            "read": "grid",
            "greed": "grid",
            "grit": "grid",
            "grade": "grid",
            "rid": "grid",
            "win": "when",
            "wen": "when",
            "radio": "ready",
            "redi": "ready",
            "rady": "ready",
        }

    def on_start(self) -> bool:
        try:
            saved_games = self.global_config.get("dcs_saved_games_folder", ".")
            self.api = API(saved_games_folder=saved_games)
            self.api.interval = self.update_interval
            self.api.register_on_update_callback(lambda api: self.on_api_update(api))

            self.listener = self.api.create_radio_listener()
            self.listener.start(
                frequency=self.frequency,
                modulation=self.modulation,
                encryption=self.encryption,
            )
            self.listener.register_message_callback(self._on_message_received)

            self.api.run()

            self.running = True
            self.paused = False
            self.logger.info("VoiceArty started")
            return True
        except Exception as error:
            self.logger.error(f"Failed to start VoiceArty: {error}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            self.running = False

            if self.listener is not None:
                self.listener.stop()
                self.listener = None

            if self.api is not None:
                self.api.stop()
                self.api = None

            self.state_by_unit.clear()
            self.logger.info("VoiceArty stopped")
            return True
        except Exception as error:
            self.logger.error(f"Failed to stop VoiceArty: {error}", exc_info=True)
            return False

    def on_pause(self) -> bool:
        self.paused = True
        return True

    def on_resume(self) -> bool:
        self.paused = False
        return True

    def on_api_update(self, api: API):
        if not self.running or self.paused:
            return
        self.watchdog_tick()

    def _on_message_received(self, recognized_text: str, unit_id: str):
        if not self.running or self.paused or self.api is None or self.listener is None:
            return

        message = recognized_text.lower()
        normalized_message = self._normalize_intent_text(message)
        unit_name = self._resolve_callsign(unit_id)
        state = self.state_by_unit.setdefault(
            unit_id,
            {
                "phase": "first",
                "warnord_type": "",
                "warnord_method": "",
                "grid": "",
                "target_latlng": None,
            },
        )

        try:
            if state["phase"] == "first":
                self._set_prompt_if_supported(
                    f"The message will be in the format: Hammer, {unit_name}, and then two parts of the message. "
                    f"Part one can be one of: fire for effect; adjust fire; smoke; illumination; suppression; "
                    f"immediate suppression. Part two can be: grid; polar; shift from known point."
                )

                if "fire for effect" in normalized_message and "grid" in normalized_message:
                    state["warnord_type"] = "ffe"
                    state["warnord_method"] = "grid"
                    state["phase"] = "second"
                    self._send_voice(f"{unit_name}, Hammer, fire for effect, grid, out.")
                elif "fire for effect" in normalized_message:
                    self._send_voice(f"{unit_name}, Hammer, fire for effect, say again method.")
                else:
                    self._send_voice(f"{unit_name}, Hammer, say again.")
                return

            if state["phase"] == "second" and state["warnord_type"] == "ffe" and state["warnord_method"] == "grid":
                self._set_prompt_if_supported(
                    f"The message will be in the format: Hammer, {unit_name}, and then a grid coordinate in the form of "
                    f"two letters in NATO phonetic format and two sets of 4 digits. Ignore everything except the grid."
                )

                grid = extract_mgrs_100k(message)
                if not grid:
                    self._send_voice(f"{unit_name}, Hammer, say again grid.")
                    return

                state["grid"] = grid
                state["target_latlng"] = self._grid_to_target_latlng(grid)

                readback = format_grid_for_readback(grid)
                self._send_voice(f"{unit_name}, Hammer, grid {readback}.")

                if state["target_latlng"] is not None:
                    state["phase"] = "third"
                return

            if state["phase"] == "third" and state["warnord_type"] == "ffe" and state["warnord_method"] == "grid":
                self._set_prompt_if_supported(
                    f"The message will be in the format: Hammer, {unit_name}, and then a command. The commands are: fire when ready."
                )

                if "fire when ready" in normalized_message:
                    self._send_voice(f"{unit_name}, Hammer, wilco, wait over.")
                    self._fire_artillery(state["target_latlng"])
                    self.state_by_unit[unit_id] = {
                        "phase": "first",
                        "warnord_type": "",
                        "warnord_method": "",
                        "grid": "",
                        "target_latlng": None,
                    }
        except Exception as error:
            self.logger.error(f"Error in voice artillery callback: {error}", exc_info=True)

    def _resolve_callsign(self, unit_id: str) -> str:
        try:
            units = self.api.get_units()
            unit = units.get(unit_id)

            if unit is None:
                try:
                    unit = units.get(int(unit_id))
                except (TypeError, ValueError):
                    pass

            if unit is None:
                try:
                    self.api.update_units()
                    units = self.api.get_units()
                except Exception:
                    units = units or {}

                unit = units.get(unit_id)
                if unit is None:
                    try:
                        unit = units.get(int(unit_id))
                    except (TypeError, ValueError):
                        pass

            if unit is not None:
                for attr_name in ("callsign", "name", "unit_name", "group_name"):
                    value = getattr(unit, attr_name, None)
                    if value:
                        return str(value)

            for candidate in units.values():
                candidate_ids = {
                    str(getattr(candidate, "ID", "")),
                    str(getattr(candidate, "unit_id", "")),
                }
                if str(unit_id) in candidate_ids:
                    for attr_name in ("callsign", "name", "unit_name", "group_name"):
                        value = getattr(candidate, attr_name, None)
                        if value:
                            return str(value)
        except Exception:
            self.logger.debug("Callsign resolution failed for unit_id=%s", unit_id, exc_info=True)
        return "last station calling"

    def _grid_to_target_latlng(self, grid: str):
        reference_unit = next(
            (
                unit
                for unit in self.api.get_units().values()
                if unit.name == self.artillery_reference_name and unit.coalition == self.friendly_coalition
            ),
            None,
        )

        if reference_unit is None:
            self.logger.warning("No artillery reference unit found for grid conversion")
            return None

        return mgrs_100k_to_latlng(grid, reference_unit.position)

    def _fire_artillery(self, target_latlng):
        if target_latlng is None:
            self.logger.warning("No target position available for fire mission")
            return

        for unit in self.api.get_units().values():
            if unit.name == self.artillery_fire_unit_name and unit.coalition == self.friendly_coalition:
                #unit.fire_at_area(target_latlng)
                unit.fire_at_area(target_latlng, 1, 0)

    def _send_voice(self, text: str):
        if self.api is None or self.listener is None:
            return

        audio_file = None
        try:
            audio_file = self.api.generate_audio_message(text, voice=self.voice)
            self.listener.transmit_on_frequency(
                file_name=audio_file,
                frequency=self.listener.frequency,
                modulation=self.listener.modulation,
                encryption=self.listener.encryption,
            )
        except Exception as error:
            self.logger.error(f"Failed to transmit voice response: {error}", exc_info=True)

    def _set_prompt_if_supported(self, prompt_text: str):
        if self.listener is None:
            return

        set_prompt_fn = getattr(self.listener, "set_prompt", None)
        if callable(set_prompt_fn):
            set_prompt_fn(prompt_text)

    def _normalize_intent_text(self, text: str) -> str:
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        normalized_tokens = [self.intent_token_map.get(token, token) for token in tokens]
        return " ".join(normalized_tokens)
            
