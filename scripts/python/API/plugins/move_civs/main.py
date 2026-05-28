"""
Civilian movement plugin for DCS Olympus API.
"""
import sys
import re
import random
from pathlib import Path

api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from plugin_base import Plugin
from data.data_types import LatLng

class move_civs(Plugin):
    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)

        self.config = global_config.get("plugin_settings", {}).get(plugin_info.get("name"), {})
        self.update_interval = float(self.config.get("update_interval", 1.0))
        self.follow_roads = bool(self.config.get("follow_roads", True))
        self.api = None
        self._speed_set_ids = set()

    def on_start(self) -> bool:
        try:
            self.api = API(saved_games_folder=self.global_config.get("dcs_saved_games_folder", "."), load_kokoro=False, load_whisper=False)
            self.api.interval = self.update_interval
            self.api.register_on_update_callback(lambda api: self.on_api_update(api))
            self.api.run()
            self.logger.info("MoveCivs started")
            return True
        except Exception as error:
            self.logger.error(f"Failed to start MoveCivs: {error}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            if self.api is not None:
                self.api.stop()
                self.api = None
            self.logger.info("MoveCivs stopped")
            return True
        except Exception as error:
            self.logger.error(f"Failed to stop MoveCivs: {error}", exc_info=True)
            return False

    def on_pause(self) -> bool:
        return True

    def on_resume(self) -> bool:
        return True

    def on_api_update(self, api: API):
        self.watchdog_tick()
        get_all_units = api.get_units()
        get_zone = self.get_zones()
        for unit in get_all_units.values():
            unit_name = unit.unit_name
            civ_match = re.search(r"CIV_(.*?)_", unit_name)
            if not civ_match:
                continue
            units_zone_name = civ_match.group(1)

            if unit.ID not in self._speed_set_ids:
                unit.set_speed(1)
                unit.set_follow_roads(False)
                self._speed_set_ids.add(unit.ID)

            if unit.active_path:
                continue

            for zone in get_zone:
                sv_zone_name = re.search(r"^[sSlL][vVhH]-(.*)-\d+$", zone["name"])
                if sv_zone_name:
                    if units_zone_name == sv_zone_name.group(1):
                        bounds = self.get_zone_bounds(zone)
                        if bounds:
                            random_lat = random.uniform(bounds["min_lat"], bounds["max_lat"])
                            random_lng = random.uniform(bounds["min_lng"], bounds["max_lng"])
                            self.logger.info(f"Moving {unit_name} to lat={random_lat:.5f}, lng={random_lng:.5f}")
                            unit.set_path([LatLng(random_lat, random_lng, 0)])
                            break

    def get_zone_bounds(self, zone):
        vertices = zone.get("vertices")
        if not vertices:
            return None
        lats = [v["lat"] for v in vertices.values()]
        lngs = [v["lng"] for v in vertices.values()]
        return {
            "min_lat": min(lats),
            "max_lat": max(lats),
            "min_lng": min(lngs),
            "max_lng": max(lngs),
        }
            
            #self.logger.info(f"Moving civilian unit: {unit_name} in zone: {get_zone}")

    def get_zones(self):
        try:
            mission = self.api.update_mission()
            mission_triggers = mission.get("triggers", {})
            zones = []
            for trigger in mission_triggers:
                zone_name = mission_triggers[trigger].get("name", "")
                if re.match(r"^[tT][cC]-.+-\d+$", zone_name) or re.match(r"^[sSlL][vVhH]-.+-\d+$", zone_name):
                    zones.append(mission_triggers[trigger])
            return zones
        except Exception as e:
            self.logger.error(f"Error in get_zones: {e}", exc_info=True)
            return []