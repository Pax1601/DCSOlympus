"""
Civilian management plugin for DCS Olympus API.
"""
import sys
import re
import random
import math
from difflib import SequenceMatcher
from pathlib import Path

from data.data_types import LatLng, BoundingPolygon
from data.unit_spawn_table import UnitSpawnTable
from unit.unit import Unit
from weapon.weapon import Weapon

api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from plugin_base import Plugin

class Civs(Plugin):
    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)

        self.config = global_config.get("plugin_settings", {}).get(plugin_info.get("name"), {})
        self.update_interval = float(self.config.get("update_interval", 1.0))
        self.frequency = float(self.config.get("frequency_hz", 30.000e6))
        self.modulation = int(self.config.get("modulation", 1))
        self.encryption = int(self.config.get("encryption", 0))
        self.voice = str(self.config.get("voice", "am_michael"))
        self.friendly_coalition = str(self.config.get("friendly_coalition", "blue"))
        self.api = None
        self.listener = None
        raw_unit_types = self.config.get("civilian_unit_types", {"Soldier M4": []})
        if isinstance(raw_unit_types, dict):
            self.civilian_unit_types: dict[str, list[str]] = {str(k): list(v) for k, v in raw_unit_types.items()}
        elif isinstance(raw_unit_types, list):
            # Backward compatibility: flat list with optional separate liveries key
            fallback_liveries = list(self.config.get("civilian_liveries", []))
            self.civilian_unit_types = {str(t): fallback_liveries for t in raw_unit_types}
        else:
            self.civilian_unit_types = {"Soldier M4": []}
        self.zone_registry: dict = {}
        self._zone_registry_built: bool = False
        self._spawned_zones: set = set()
        self.known_names: list[str] = list(self.config.get("known_names", []))
        self.fuzzy_match_threshold: float = float(self.config.get("fuzzy_match_threshold", 0.75))

    def on_start(self) -> bool:
        try:
            self.api = API(saved_games_folder=self.global_config.get("dcs_saved_games_folder", "."), SRS_folder=self.global_config.get('SRS_folder', '.'))
            self.api.interval = self.update_interval
            self.api.register_on_update_callback(lambda api: self.on_api_update(api))

            self.listener = self.api.create_radio_listener()
            self.listener.start(
                frequency=self.frequency,
                modulation=self.modulation,
                encryption=self.encryption,
            )
            self.listener.register_message_callback(self._on_message_received)
            self._update_listener_prompt()

            self.api.run()

            self.running = True
            self.paused = False
            self.logger.info("Civs started")
            return True
        except Exception as error:
            self.logger.error(f"Failed to start Civs: {error}", exc_info=True)
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
                
            return True
        except Exception as error:
            self.logger.error(f"Failed to stop Civs: {error}", exc_info=True)
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
        if not self._zone_registry_built:
            self._build_zone_registry()
        self.watchdog_tick()
        #function here to check units in the zones, see if they are named in the correct manner

    def _spawn_civilians_at_zone(self, zone_data: dict):
        try:
            tc = zone_data.get("tc")
            sv = zone_data.get("sv")
            display_name = zone_data.get("display_name", "")
            if display_name in self._spawned_zones:
                self.logger.info(f"Civilians already spawned at '{display_name}', skipping.")
                return
            if tc is None or tc.get("lat") is None:
                self.logger.warning(f"No TC position for zone '{zone_data.get('display_name')}', cannot spawn civilians.")
                return

            tc_centre = LatLng(float(tc["lat"]), float(tc["lng"]), 0.0)
            count = max(1, int(tc.get("count", 2)))

            for i in range(count):
                group_name = f"CIV_{zone_data['display_name']}_{random.randint(0, 9999):04d}"
                pos = tc_centre.project_with_bearing_and_distance(
                    random.uniform(1, 15),
                    random.uniform(0, 2 * math.pi),
                )
                unit_type = random.choice(list(self.civilian_unit_types.keys()))
                liveries = self.civilian_unit_types[unit_type]
                livery_id = random.choice(liveries) if liveries else ""
                self.api.spawn_ground_units(
                    units=[UnitSpawnTable(
                        unit_type=unit_type,
                        location=pos,
                        skill="Average",
                        livery_id=livery_id,
                        altitude=0,
                        heading=random.randint(0, 360),
                        name=f"{group_name}_0",
                    )],
                    coalition="neutral",
                    country="",
                    immediate=True,
                    spawnPoints=0,
                    groupName=group_name,
                )

            self._spawned_zones.add(display_name)
            self.logger.info(
                f"Spawning {count} civilians at '{zone_data['display_name']}'"
            )
        except Exception as e:
            self.logger.error(f"Error in _spawn_civilians_at_zone: {e}", exc_info=True)

    def _build_zone_registry(self):
        """
        Parse TC-<name>-<size> and SV-<name>-<size> trigger zones from the mission,
        link each SV to its matching TC by shared name, and store the result in
        self.zone_registry keyed by lowercase zone name.
        """
        try:
            mission = self.api.update_mission()
            if not mission:
                return
            mission_triggers = mission.get("triggers", {})

            tc_zones: dict = {}
            sv_zones: dict = {}

            for trigger in mission_triggers:
                zone = mission_triggers[trigger]
                zone_name = zone.get("name", "")

                tc_match = re.match(r"^[tT][cC]-(.+)-(\d+)$", zone_name)
                sv_match = re.match(r"^[sS][vV]-(.+)-(\d+)$", zone_name)

                if tc_match:
                    name_key = tc_match.group(1).lower()
                    location = zone.get("location", {})
                    tc_zones[name_key] = {
                        "name": zone_name,
                        "display_name": tc_match.group(1),
                        "count": int(tc_match.group(2)),
                        "radius": float(zone.get("radius", 0)),
                        "lat": location.get("lat"),
                        "lng": location.get("lng"),
                    }
                elif sv_match:
                    name_key = sv_match.group(1).lower()
                    location = zone.get("location", {})
                    vertices = []
                    raw_verts = zone.get("vertices", [])
                    # vertices may be a JSON list or a dict with numeric string keys
                    if isinstance(raw_verts, dict):
                        raw_verts = [raw_verts[k] for k in sorted(raw_verts, key=lambda x: int(x))]
                    for v in raw_verts:
                        if isinstance(v, dict) and "lat" in v:
                            vertices.append(LatLng(float(v["lat"]), float(v["lng"]), 0.0))
                    sv_zones[name_key] = {
                        "name": zone_name,
                        "display_name": sv_match.group(1),
                        "polygon": BoundingPolygon(vertices) if len(vertices) >= 3 else None,
                        "lat": location.get("lat"),
                        "lng": location.get("lng"),
                    }

            registry: dict = {}
            for key in set(tc_zones) | set(sv_zones):
                tc = tc_zones.get(key)
                sv = sv_zones.get(key)
                display_name = (tc or sv)["display_name"]
                registry[key] = {
                    "display_name": display_name,
                    "tc": tc,
                    "sv": sv,
                }

            self.zone_registry = registry
            self._zone_registry_built = True
            sv_with_polygon = sum(1 for v in registry.values() if v.get("sv") and v["sv"].get("polygon") is not None)
            self.logger.info(
                f"Zone registry built: {len(self.zone_registry)} zones — {list(self.zone_registry.keys())} "
                f"({sv_with_polygon} SV zones with valid polygons)"
            )
            self._update_listener_prompt()
        except Exception as e:
            self.logger.error(f"Failed to build zone registry: {e}", exc_info=True)

    def _update_listener_prompt(self):
        """Update the listener's transcription prompt with all known zone/place names."""
        if self.listener is None:
            return
        zone_display_names = [data["display_name"] for data in self.zone_registry.values()]
        all_names = list(dict.fromkeys(self.known_names + zone_display_names))
        if all_names:
            names_hint = ", ".join(all_names)
            self.listener.set_prompt(f"Directing to a location. Place names: {names_hint}.")
        else:
            self.listener.set_prompt("Directing to a location.")

    def _fuzzy_find_zone_in_message(self, message: str) -> tuple[str, dict] | None:
        """Find the best-matching zone key in message using Levenshtein-style ratio."""
        words = re.findall(r"[a-z0-9]+", message)
        best_key = None
        best_ratio = self.fuzzy_match_threshold - 0.001
        for zone_key, zone_data in self.zone_registry.items():
            zone_words = zone_key.split()
            if len(zone_words) == 1:
                for word in words:
                    ratio = SequenceMatcher(None, word, zone_key).ratio()
                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_key = zone_key
            else:
                # Exact substring check first for multi-word names
                if zone_key in message:
                    return zone_key, zone_data
                # Sliding window fuzzy check
                n = len(zone_words)
                for i in range(max(1, len(words) - n + 1)):
                    phrase = " ".join(words[i:i + n])
                    ratio = SequenceMatcher(None, phrase, zone_key).ratio()
                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_key = zone_key
        if best_key is not None:
            return best_key, self.zone_registry[best_key]
        return None

    def _on_message_received(self, recognized_text: str, unit_id: str):
        if not self.running or self.paused or self.api is None or self.listener is None:
            return

        units = self.api.get_units()
        if unit_id not in units:
            self.logger.warning(f"Received message from unknown unit_id={unit_id}")
        else:
            if units[unit_id].callsign.find("Olympus_API_RadioListener") != -1:
                self.logger.debug(f"Ignoring message from {units[unit_id].callsign} (unit_id={unit_id}) to prevent loops")
                return
        
        message = recognized_text.lower()
        
        if message == "":
            self._send_voice(f"Say again.")
            return
        
        try:
            match = self._fuzzy_find_zone_in_message(message)
            if match is not None:
                zone_key, zone_data = match
                tc = zone_data.get("tc")
                sv = zone_data.get("sv")
                pos = tc if tc and tc.get("lat") is not None else sv
                if pos:
                    print(
                        f"Zone identified: '{zone_data['display_name']}' — "
                        f"lat={pos['lat']:.6f}, lng={pos['lng']:.6f}"
                    )
                else:
                    print(f"Zone identified: '{zone_data['display_name']}' — position unavailable")
                self._spawn_civilians_at_zone(zone_data)
                self._send_voice(f"Roger, we see you heading to {zone_data['display_name']}.")
            else:
                self._send_voice("Didn't copy a destination.")
        except Exception as e:
            self.logger.error(f"Error in _on_message_received: {e}", exc_info=True)
            return None
    
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
                    if matches := re.match(r"Olympus", str(value or ""), re.IGNORECASE):
                        value = "Observer"
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
       

    def _send_voice(self, text: str):
        if self.api is None or self.listener is None:
            return

        try:
            future = self.api.generate_audio_message_in_executor(text, voice=self.voice)
            future.add_done_callback(lambda f: self.listener.transmit_on_frequency(file_name=f.result()))
            
        except Exception as error:
            self.logger.error(f"Failed to transmit voice response: {error}", exc_info=True)