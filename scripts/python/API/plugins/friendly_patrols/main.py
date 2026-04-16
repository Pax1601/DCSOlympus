"""
Friendly patrols plugin for DCS Olympus API.
"""

import math
import sys
import re
import random
import time
from pathlib import Path
from dataclasses import dataclass

# Add the API directory to the path so we can import the Plugin base class
api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from data.data_types import LatLng
from plugin_base import Plugin
from radio.radio_listener import RadioListener
from unit.unit import Unit

groupUnitArrary = []
tempStoreGroup = []
storingGroupCheck = False
controllingSquadCheck = False

LETTER_TO_NATO = {
    "A": "alpha", "B": "bravo", "C": "charlie", "D": "delta", "E": "echo", "F": "foxtrot",
    "G": "golf", "H": "hotel", "I": "india", "J": "juliett", "K": "kilo", "L": "lima",
    "M": "mike", "N": "november", "O": "oscar", "P": "papa", "Q": "quebec", "R": "romeo",
    "S": "sierra", "T": "tango", "U": "uniform", "V": "victor", "W": "whiskey", "X": "xray",
    "Y": "yankee", "Z": "zulu",
}

@dataclass
class Group:
    name: str
    units: list[Unit]
    movement_order: dict | None = None
    arrival_reported: bool = False
    last_contact_report_time: float = 0.0
    pending_contact_detail_time: float | None = None
    pending_contact_detail_message: str | None = None
    pending_zone_search_report_time: float | None = None
    pending_zone_search_report_message: str | None = None
    extraction_requested: bool = False
    peak_total_ammo: int = 0

class FriendlyPatrols(Plugin):
    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        self.config = plugin_info.get("config", {})
        self.frequency_hz = self._read_frequency_hz("frequency_hz")
        self.kokoro_voice_model = self._read_voice_model("kokoro_voice_model", default="am_fenrir")
        self.modulation = self._read_modulation("modulation", default=1)
        self.encryption = int(self.config.get("encryption", 0))
        self.update_interval = float(self.config.get("update_interval", 1.0))
        self.default_patrol_distance = float(self.config.get("default_patrol_distance", 1000.0))
        self.default_select_radius = float(self.config.get("default_select_radius", 1000.0))
        self.patrol_step_distance = float(self.config.get("patrol_step_distance", 50.0))
        self.engagement_duration_seconds = float(self.config.get("engagement_duration_seconds", 30.0))
        self.engagement_range = float(self.config.get("engagement_range", 300.0))
        self.destination_threshold = float(self.config.get("destination_threshold", 10.0))
        self.contact_report_cooldown_seconds = float(self.config.get("contact_report_cooldown_seconds", 300.0))
        self.contact_detail_report_delay_min_seconds = float(self.config.get("contact_detail_report_delay_min_seconds", 12.0))
        self.contact_detail_report_delay_max_seconds = float(self.config.get("contact_detail_report_delay_max_seconds", 20.0))
        self.zone_search_report_delay_min_seconds = float(self.config.get("zone_search_report_delay_min_seconds", 240.0))
        self.zone_search_report_delay_max_seconds = float(self.config.get("zone_search_report_delay_max_seconds", 360.0))
        self.zone_search_move_interval_min_seconds = float(self.config.get("zone_search_move_interval_min_seconds", 20.0))
        self.zone_search_move_interval_max_seconds = float(self.config.get("zone_search_move_interval_max_seconds", 40.0))
        self.zone_search_group_spread_radius = float(self.config.get("zone_search_group_spread_radius", 20.0))
        self.regroup_target_radius = float(self.config.get("regroup_target_radius", 25.0))
        self.extraction_health_threshold = float(self.config.get("extraction_health_threshold", 50.0))
        self.extraction_ammo_ratio_threshold = float(self.config.get("extraction_ammo_ratio_threshold", 0.25))
        if self.contact_detail_report_delay_max_seconds < self.contact_detail_report_delay_min_seconds:
            self.contact_detail_report_delay_max_seconds = self.contact_detail_report_delay_min_seconds
        if self.zone_search_report_delay_max_seconds < self.zone_search_report_delay_min_seconds:
            self.zone_search_report_delay_max_seconds = self.zone_search_report_delay_min_seconds
        if self.zone_search_move_interval_max_seconds < self.zone_search_move_interval_min_seconds:
            self.zone_search_move_interval_max_seconds = self.zone_search_move_interval_min_seconds

        self.api: API | None = None
        self.friendly_listener: RadioListener | None = None
        self.running = False
        self.paused = False

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
            self.logger.info("Friendly patrol frequency (Hz): %s", self.frequency_hz)
            self.logger.info("Kokoro voice model: %s", self.kokoro_voice_model)
            self.logger.info("Friendly modulation: %s", self.modulation)

            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'))
            self.api.interval = self.update_interval
            self.api.register_on_update_callback(self.on_update)

            self.friendly_listener = self.api.create_radio_listener()
            self.friendly_listener.set_coalition("blue")
            self.friendly_listener.set_prompt("Commander, select units.")

            if self.frequency_hz is None:
                raise ValueError("frequency_hz is required")

            self.friendly_listener.start(
                frequency=self.frequency_hz,
                modulation=self.modulation,
                encryption=self.encryption,
            )
            self.friendly_listener.register_message_callback(self.on_message_callback)
            
            self.api.run()

            self.running = True
            self.paused = False
            self.logger.info("FriendlyPatrols plugin started")

            self.groups: list[Group] = []
            self.group_names = [
                "alpha", "bravo", "charlie", "delta", "echo",
                "foxtrot", "golf", "hotel", "india", "juliett",
                "kilo", "lima", "mike", "november", "oscar",
                "papa", "quebec", "romeo", "sierra", "tango",
                "uniform", "victor", "whiskey", "xray", "yankee", "zulu",
            ]

            return True
        except Exception as e:
            self.logger.error(f"Failed to start FriendlyPatrols plugin: {e}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            self.running = False
            self.paused = False

            if self.friendly_listener:
                self.friendly_listener.stop()
                self.friendly_listener = None

            if self.api is not None:
                self.api.stop()
                self.api = None

            self.logger.info("FriendlyPatrols plugin stopped")
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop FriendlyPatrols plugin: {e}", exc_info=True)
            return False

    def on_pause(self) -> bool:
        try:
            self.paused = True
            self.logger.info("FriendlyPatrols plugin paused")
            return True
        except Exception as e:
            self.logger.error(f"Failed to pause FriendlyPatrols plugin: {e}", exc_info=True)
            return False

    def on_resume(self) -> bool:
        try:
            self.paused = False
            self.logger.info("FriendlyPatrols plugin resumed")
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume FriendlyPatrols plugin: {e}", exc_info=True)
            return False
        
    def on_update(self, api: API):
        if not self.running or self.paused:
            return
        self._dispatch_pending_contact_reports()
        self._dispatch_pending_zone_search_reports()
        self._check_groups_for_extraction_requests()
        self._update_group_movement_orders()
        self.watchdog_tick()
        
    def on_message_callback(self, message: str, unitID: str):
        global storingGroupCheck, tempStoreGroup, controllingSquadCheck

        if not self.running or self.paused or self.api is None or self.friendly_listener is None:
            return False

        self.logger.info(f"Received radio message: {message}")
        normalized_message = message.lower()

        select_keywords = ["select"]
        select_store_check_keywords = ["yes", "no"]
        show_keywords = ["show", "list"]
        hold_keywords = ["hold", "defend"]
        regroup_keywords = ["regroup"]
        position_report_keywords = ["position", "pos"]
        position_request_keywords = ["read", "report"]
        patrol_keywords = ["patrol","move", "control"]
        settlement_keywords = ["search","village", "town", "building", "buildings", "hut", "huts", "house", "town centre", "town center", "zone"]
        smoke_keywords = ["smoke"]
        remove_group_keywords = ["remove", "delete"]
        unit = self._resolve_unit(unitID)
        response = None


        if not self._check_if_valid_talkie(unit):
            self.logger.warning(f"UnitID {unitID} failed validation checks and cannot be used for commands.")
            return False
        
        if storingGroupCheck:
            if any(keyword in normalized_message for keyword in select_store_check_keywords):
                storingGroupCheck = False
                if "yes" in normalized_message:
                    group_to_store = tempStoreGroup.pop()
                    self.groups.append(group_to_store)
                    #we also need to remove these units from any other groups they are in
                    group_to_store_unit_ids = {stored_unit.ID for stored_unit in group_to_store.units}
                    for group in self.groups:
                        if group is not group_to_store:
                            group.units = [unit for unit in group.units if unit not in group_to_store.units]
                            self._remove_units_from_group_order(group, group_to_store_unit_ids)
                    response = f"Squad {group_to_store.name} created with {len(group_to_store.units)} units."
                else:
                    tempStoreGroup.pop()
                    response = "Squad creation cancelled."
                self._transmit_response(response)
                return False


        if any(keyword in normalized_message for keyword in select_keywords):
            self.logger.info(f"Unit {unitID} wants to select.")
            radius_match = re.search(r"(\d+)\s*(meters|m)?", normalized_message)
            radius_match_commas = re.search(r"(\d+)\s*(,|\s)?(\d+)\s*(meters|m)?", normalized_message)
            joined_radius = None
            if radius_match_commas.group(2) == ",":
                joined_radius = radius_match_commas.group(1) + radius_match_commas.group(3)
                if joined_radius is not None:
                    radius = int(joined_radius)
                else:
                    radius = int(radius_match.group(1)) if radius_match else self.default_select_radius
            else:   
                radius = int(radius_match.group(1)) if radius_match else self.default_select_radius

            get_units_within_radius = self.get_units_within_radius(unit, radius)
            if self.get_units_within_radius is None or len(get_units_within_radius) == 0:
                self.logger.warning(f"Failed to get any nearby units for unitID {unitID}.")
                response = f"Nothing selected within {radius} meters."
            else:
                group_name_next = self._get_next_group_name()
                if group_name_next is None:
                    response = "No squad names are available. Remove a squad before creating a new one."
                else:
                    group = Group(name=group_name_next, units=get_units_within_radius)
                    response = f"{len(get_units_within_radius)} units selected, do you want to create squad {group_name_next}?"
                    tempStoreGroup.append(group)
                    storingGroupCheck = True
                #self.groups.append(group)
                #response = f"Selected {len(get_units_within_radius)} units, added to group {group_name}."
        elif any(keyword in normalized_message for keyword in remove_group_keywords):
            self.logger.info(f"Unit {unitID} wants to remove a squad.")
            if len(self.groups) == 0:
                response = "No squads created yet."
            elif any(group_name in normalized_message for group_name in self.group_names):
                group_to_remove = self._find_group_by_name(normalized_message)
                if group_to_remove:
                    group_to_remove.movement_order = None
                    group_to_remove.arrival_reported = False
                    group_to_remove.pending_contact_detail_time = None
                    group_to_remove.pending_contact_detail_message = None
                    group_to_remove.pending_zone_search_report_time = None
                    group_to_remove.pending_zone_search_report_message = None
                    group_to_remove.extraction_requested = False
                    self.groups.remove(group_to_remove)
                    response = f"Squad {group_to_remove.name} removed."
                else:
                    response = "Squad not found."
            else:
                response = "Please specify a squad to remove."
        elif any(keyword in normalized_message for keyword in show_keywords):
            self.logger.info(f"Unit {unitID} wants to show groups.")
            if len(self.groups) == 0:
                response = "No squads created yet."
            else:
                group_list = ", ".join([f"{group.name} ({len(group.units)} units)" for group in self.groups])
                response = f"Current squads: {group_list}."
        elif any(keyword in normalized_message for keyword in smoke_keywords):
            self.logger.info(f"Unit {unitID} requested squad smoke.")
            if self.groups is None or len(self.groups) == 0:
                response = "No squads available for smoke."
            elif any(group_name in normalized_message for group_name in self.group_names):
                controlled_group = self._find_group_by_name(normalized_message)
                if controlled_group is None:
                    response = "That squad no longer exists. Say show squads to hear the current squad list."
                else:
                    response = self._deploy_group_smoke(controlled_group)
            else:
                response = "Please specify which squad should pop smoke."
        elif any(keyword in normalized_message for keyword in hold_keywords):
            self.logger.info(f"Unit {unitID} requested squad hold position.")
            if self.groups is None or len(self.groups) == 0:
                response = "No squads available to hold position."
            elif any(group_name in normalized_message for group_name in self.group_names):
                controlled_group = self._find_group_by_name(normalized_message)
                if controlled_group is None:
                    response = "That squad no longer exists. Say show squads to hear the current squad list."
                else:
                    response = self._start_group_hold(controlled_group)
            else:
                response = "Please specify which squad should hold position."
        elif any(keyword in normalized_message for keyword in regroup_keywords):
            self.logger.info(f"Unit {unitID} requested squad regroup.")
            if self.groups is None or len(self.groups) == 0:
                response = "No squads available to regroup."
            elif any(group_name in normalized_message for group_name in self.group_names):
                controlled_group = self._find_group_by_name(normalized_message)
                if controlled_group is None:
                    response = "That squad no longer exists. Say show squads to hear the current squad list."
                else:
                    response = self._start_group_regroup(controlled_group)
            else:
                response = "Please specify which squad should regroup."
        elif any(keyword in normalized_message for keyword in position_report_keywords) and any(keyword in normalized_message for keyword in position_request_keywords):
            self.logger.info(f"Unit {unitID} requested squad position report.")
            if self.groups is None or len(self.groups) == 0:
                response = "No squads available to report position."
            elif any(group_name in normalized_message for group_name in self.group_names):
                controlled_group = self._find_group_by_name(normalized_message)
                if controlled_group is None:
                    response = "That squad no longer exists. Say show squads to hear the current squad list."
                else:
                    response = self._report_group_position(controlled_group)
            else:
                response = "Please specify which squad should report position."
        elif any(keyword in normalized_message for keyword in patrol_keywords):
            self.logger.info(f"Unit {unitID} wants to start a patrol.")
            if self.groups is None or len(self.groups) == 0:
                self.logger.warning(f"No squads available for patrolling for unitID {unitID}.")
                response = "No squads available to patrol."
            elif any(group_name in normalized_message for group_name in self.group_names):
                controlled_group = self._find_group_by_name(normalized_message)
                if controlled_group is None:
                    self.logger.warning(f"Requested squad not found for patrol command: {message}")
                    response = "That squad no longer exists. Say show squads to hear the current squad list."
                else:
                    distance_match = re.search(r"(\d+)\s*(meters|meter|m)\b", normalized_message)
                    distance = int(distance_match.group(1)) if distance_match else self.default_patrol_distance

                    if "north east" in normalized_message or "northeast" in normalized_message:
                        patrol_direction = "north east"
                        bearing = 45 * math.pi / 180
                    elif "south east" in normalized_message or "southeast" in normalized_message:
                        patrol_direction = "south east"
                        bearing = 135 * math.pi / 180
                    elif "north west" in normalized_message or "northwest" in normalized_message:
                        patrol_direction = "north west"
                        bearing = 315 * math.pi / 180
                    elif "south west" in normalized_message or "southwest" in normalized_message:
                        patrol_direction = "south west"
                        bearing = 225 * math.pi / 180
                    elif "north" in normalized_message:
                        patrol_direction = "north"
                        bearing = 0 * math.pi / 180                
                    elif "east" in normalized_message:
                        patrol_direction = "east"
                        bearing = 90 * math.pi / 180
                    elif "south" in normalized_message:
                        patrol_direction = "south"
                        bearing = 180 * math.pi / 180
                    elif "west" in normalized_message:
                        patrol_direction = "west"
                        bearing = 270 * math.pi / 180
                    elif "location" in normalized_message or "position" in normalized_message:
                        patrol_direction = "to your location"
                        bearing = None
                        distance = None
                    elif any(keyword in normalized_message for keyword in settlement_keywords):
                        patrol_direction = "to nearby settlement"
                        bearing = None
                        distance = None
                    else:
                        patrol_direction = None

                    if patrol_direction is None:
                        response = "Didn't copy a valid patrol direction or command."
                    else:
                        response = self._start_group_patrol(
                            controlled_group,
                            unit,
                            patrol_direction,
                            bearing,
                            distance,
                        )
            else:
                response = "Please specify which squad to control."
            # Implement patrol logic here

        else:
            response = "Say again."

        if response:
            self._transmit_response(response)
            return False
        else:
            self.logger.warning(f"No response generated for message: {message}")
            return False
    
    def _check_if_valid_talkie(self, unit: Unit) -> bool:
        if unit is None:
            self.logger.warning("Unit not found in game units.")
            return False

        unitID = unit.ID

        if unit.coalition != "blue":
            self.logger.warning(f"UnitID {unitID} is not on the blue coalition and cannot be selected.")
            return False
        
        if unit.position is None:
            self.logger.warning(f"UnitID {unitID} has no position and cannot be selected.")
            return False
        
        if unit.position.lat == 0 and self._get_position_lng(unit.position) == 0 and unit.position.alt == 0:
            self.logger.warning(f"UnitID {unitID} has an invalid position and cannot be used to select.")
            return False
        
        return True

    def _resolve_unit(self, unit_id) -> Unit | None:
        if self.api is None:
            return None

        units = self.api.get_units()
        if unit_id in units:
            return units[unit_id]

        try:
            numeric_id = int(unit_id)
        except (TypeError, ValueError):
            numeric_id = None

        if numeric_id is not None and numeric_id in units:
            return units[numeric_id]

        for candidate in units.values():
            if str(candidate.ID) == str(unit_id):
                return candidate
        return None

    def _find_group_by_name(self, normalized_message: str) -> Group | None:
        message_words = set(re.findall(r"[a-z0-9]+", normalized_message))
        for group in self.groups:
            if group.name.lower() in message_words:
                return group
        return None

    def _get_next_group_name(self) -> str | None:
        existing_names = {group.name.lower() for group in self.groups}
        for group_name in self.group_names:
            if group_name.lower() not in existing_names:
                return group_name
        return None
                    
    def get_units_within_radius(self, center_unit: Unit, radius: float):
        if self.api is None:
            return None
        
        units = self.api.get_units()
        closest_units = []
        for unit in units.values():
            if unit.alive and unit.coalition in ["blue"] and unit.category.lower() in ["groundunit"] and (unit.operate_as is None or unit.operate_as == ["blue"] or unit.coalition != "neutral"):
                distance = center_unit.position.distance_to(unit.position)
                if distance < radius:
                    closest_units.append(unit)
        return closest_units

    def _transmit_response(self, response: str):
        if not response or self.api is None or self.friendly_listener is None:
            return

        future = self.api.generate_audio_message_in_executor(response, voice=self.kokoro_voice_model)
        future.add_done_callback(lambda f: self.friendly_listener.transmit_on_frequency(file_name=f.result()))

    def _deploy_group_smoke(self, group: Group) -> str:
        smoke_unit = self._get_group_smoke_unit(group)
        average_position = self._get_group_average_position(group)
        if smoke_unit is None or average_position is None:
            return f"No living units are available in squad {group.name} to pop smoke."

        try:
            smoke_unit.set_pickup_location(average_position)
            smoke_unit.smoke_pickup_location()
        except Exception as error:
            self.logger.warning(f"Failed to deploy smoke for squad {group.name}: {error}")
            return f"Unable to deploy smoke for squad {group.name}."

        return f"{group.name}, smoke out"

    def _report_group_position(self, group: Group) -> str:
        average_position = self._get_group_average_position(group)
        if average_position is None:
            return f"No living units are available in squad {group.name} to report position."

        raw_grid = self._format_enemy_mgrs(average_position)
        spoken_grid = self._format_mgrs_for_readback(raw_grid)
        if not spoken_grid:
            return f"{group.name}, position, grid unknown, out."

        return f"{group.name}, position, grid {spoken_grid}, out."

    def _get_group_smoke_unit(self, group: Group) -> Unit | None:
        for squad_unit in group.units:
            current_unit = self._resolve_unit(squad_unit.ID)
            if current_unit is None or not current_unit.alive:
                continue
            if current_unit.position is None:
                continue
            return current_unit
        return None

    def _get_group_average_position(self, group: Group) -> LatLng | None:
        active_positions = []
        for squad_unit in group.units:
            current_unit = self._resolve_unit(squad_unit.ID)
            if current_unit is None or not current_unit.alive or current_unit.position is None:
                continue
            active_positions.append(current_unit.position)

        if not active_positions:
            return None

        average_lat = sum(position.lat for position in active_positions) / len(active_positions)
        average_lng = sum(self._get_position_lng(position) for position in active_positions) / len(active_positions)
        average_alt = sum(position.alt for position in active_positions) / len(active_positions)
        return LatLng(average_lat, average_lng, average_alt)

    def _remove_units_from_group_order(self, group: Group, unit_ids: set[int]):
        if group.movement_order is None:
            return

        tracked_units = group.movement_order.get("units", {})
        for unit_id in list(tracked_units):
            try:
                numeric_unit_id = int(unit_id)
            except (TypeError, ValueError):
                numeric_unit_id = unit_id
            if numeric_unit_id in unit_ids:
                del tracked_units[unit_id]

        if not tracked_units:
            group.movement_order = None
            group.arrival_reported = False

    def _start_group_patrol(self, group: Group, command_unit: Unit, patrol_direction: str, bearing: float | None, distance: float | None) -> str:
        tracked_units = {}
        active_unit_count = 0
        target_zone = None
        search_zone = None
        target_zone_name = None

        group.pending_zone_search_report_time = None
        group.pending_zone_search_report_message = None

        if patrol_direction == "to nearby settlement":
            target_zone = self._get_nearest_town_centre_zone(group)
            if target_zone is None:
                group.movement_order = None
                group.arrival_reported = False
                return "No nearby village or town centre zones were found."
            search_zone = self._get_linked_zone_for_town_centre(target_zone)
            target_zone_name = self._format_zone_name_for_speech(target_zone.get("name", "town centre"))

        for squad_unit in group.units:
            current_unit = self._resolve_unit(squad_unit.ID)
            if not self._can_issue_patrol_order(current_unit):
                continue

            final_destination = self._build_final_destination(current_unit, command_unit, patrol_direction, bearing, distance, target_zone)
            if final_destination is None:
                continue

            next_step = self._get_next_step_destination(current_unit.position, final_destination)
            try:
                current_unit.unregister_on_destination_reached_callback()
            except Exception:
                pass

            current_unit.set_path([next_step])

            tracked_units[str(current_unit.ID)] = {
                "final_destination": final_destination,
                "step_destination": next_step,
                "state": "moving",
                "engagement_end_time": None,
                "last_engagement_command_time": 0.0,
                "engagement_enemy_id": None,
            }
            active_unit_count += 1

        if active_unit_count == 0:
            group.movement_order = None
            group.arrival_reported = False
            return f"No living units are available in squad {group.name}."

        group.movement_order = {
            "direction": patrol_direction,
            "units": tracked_units,
            "arrival_message_enabled": patrol_direction != "to nearby settlement",
            "zone_search_enabled": patrol_direction == "to nearby settlement",
            "zone_search_started": False,
            "zone_search_next_move_time": None,
            "zone_search_anchor": None,
            "target_zone": target_zone,
            "search_zone": search_zone if search_zone is not None else target_zone,
            "target_zone_name": target_zone_name,
        }
        group.arrival_reported = False

        if patrol_direction == "to your location":
            return f"Squad {group.name} is moving to your location."

        if patrol_direction == "to nearby settlement":
            return f"Squad {group.name} is moving to {target_zone_name}."

        return f"Squad {group.name} is moving {patrol_direction} for {self.roundup(distance)} metres."

    def _start_group_hold(self, group: Group) -> str:
        hold_anchor = self._get_group_average_position(group)
        if hold_anchor is None:
            group.movement_order = None
            group.arrival_reported = False
            return f"No living units are available in squad {group.name} to hold position."

        return self._start_group_hold_at_anchor(
            group,
            hold_anchor,
            f"Squad {group.name} holding position and defending the area.",
            hold_spread_radius=12.0,
        )

    def _start_group_hold_at_anchor(
        self,
        group: Group,
        hold_anchor: LatLng,
        response_text: str | None = None,
        hold_spread_radius: float = 12.0,
    ) -> str:
        if hold_anchor is None:
            group.movement_order = None
            group.arrival_reported = False
            return f"No living units are available in squad {group.name} to hold position."

        group.pending_zone_search_report_time = None
        group.pending_zone_search_report_message = None

        tracked_units = {}
        active_unit_count = 0

        for squad_unit in group.units:
            current_unit = self._resolve_unit(squad_unit.ID)
            if not self._can_issue_patrol_order(current_unit):
                continue

            hold_destination = hold_anchor.project_with_bearing_and_distance(
                random.uniform(0, hold_spread_radius),
                math.radians(random.uniform(0, 360)),
            )
            next_step = self._get_next_step_destination(current_unit.position, hold_destination)
            try:
                current_unit.unregister_on_destination_reached_callback()
            except Exception:
                pass

            current_unit.set_path([next_step])
            tracked_units[str(current_unit.ID)] = {
                "final_destination": hold_destination,
                "step_destination": next_step,
                "state": "holding_final" if current_unit.position.distance_to(hold_destination) <= self.destination_threshold else "moving",
                "engagement_end_time": None,
                "last_engagement_command_time": 0.0,
                "engagement_enemy_id": None,
            }
            active_unit_count += 1

        if active_unit_count == 0:
            group.movement_order = None
            group.arrival_reported = False
            return f"No living units are available in squad {group.name} to hold position."

        group.movement_order = {
            "direction": "hold",
            "units": tracked_units,
            "arrival_message_enabled": False,
        }
        group.arrival_reported = False
        return response_text or f"Squad {group.name} holding position and defending the area."

    def _start_group_regroup(self, group: Group) -> str:
        regroup_anchor = self._get_group_average_position(group)
        if regroup_anchor is None:
            group.movement_order = None
            group.arrival_reported = False
            return f"No living units are available in squad {group.name} to regroup."

        return self._start_group_hold_at_anchor(
            group,
            regroup_anchor,
            f"Squad {group.name} regrouping now.",
            hold_spread_radius=self.regroup_target_radius,
        )

    def _update_group_movement_orders(self):
        if self.api is None:
            return

        current_time = time.monotonic()
        for group in self.groups:
            if group.movement_order is None:
                continue
            self._update_group_movement_order(group, current_time)

    def _update_group_movement_order(self, group: Group, current_time: float):
        if group.movement_order is None:
            return

        tracked_units = group.movement_order.get("units", {})
        if not tracked_units:
            group.movement_order = None
            group.arrival_reported = False
            return

        active_unit_count = 0
        arrived_unit_count = 0

        for unit_id, unit_order in tracked_units.items():
            patrol_unit = self._resolve_unit(unit_id)
            if patrol_unit is None or not patrol_unit.alive or patrol_unit.position is None:
                unit_order["state"] = "inactive"
                continue

            active_unit_count += 1
            unit_state = unit_order.get("state")

            if unit_state == "moving":
                self._update_patrol_unit_movement(group, patrol_unit, unit_order, current_time)
            elif unit_state == "engaging":
                self._update_patrol_unit_engagement(group, patrol_unit, unit_order, current_time)
            elif unit_state == "holding_final":
                self._maybe_start_patrol_engagement(group, patrol_unit, unit_order, current_time)

            if unit_order.get("state") == "holding_final":
                arrived_unit_count += 1

        if active_unit_count == 0:
            group.movement_order = None
            group.arrival_reported = False
            return

        if arrived_unit_count == active_unit_count and not group.arrival_reported:
            group.arrival_reported = True
            if group.movement_order.get("zone_search_enabled"):
                self._handle_group_zone_search_arrival(group)
            elif group.movement_order.get("arrival_message_enabled", True):
                self._transmit_response(f"Group {group.name} has reached its destination.")

        if group.movement_order.get("zone_search_enabled") and group.arrival_reported:
            self._update_group_zone_search(group, current_time)

    def _update_patrol_unit_movement(self, group: Group, patrol_unit: Unit, unit_order: dict, current_time: float):
        step_destination = unit_order.get("step_destination")
        final_destination = unit_order.get("final_destination")
        if step_destination is None or final_destination is None:
            unit_order["state"] = "inactive"
            return

        if patrol_unit.position.distance_to(step_destination) > self.destination_threshold:
            return

        if patrol_unit.position.distance_to(final_destination) <= self.destination_threshold:
            unit_order["state"] = "holding_final"
            self._maybe_start_patrol_engagement(group, patrol_unit, unit_order, current_time)
            return

        if self._maybe_start_patrol_engagement(group, patrol_unit, unit_order, current_time):
            unit_order["state"] = "engaging"
            unit_order["engagement_end_time"] = current_time + self.engagement_duration_seconds
            return

        self._advance_patrol_unit_to_next_step(patrol_unit, unit_order)

    def _update_patrol_unit_engagement(self, group: Group, patrol_unit: Unit, unit_order: dict, current_time: float):
        self._maybe_start_patrol_engagement(group, patrol_unit, unit_order, current_time)
        engagement_end_time = unit_order.get("engagement_end_time")
        if engagement_end_time is None or current_time < engagement_end_time:
            return

        self._advance_patrol_unit_to_next_step(patrol_unit, unit_order)

    def _maybe_start_patrol_engagement(self, group: Group, patrol_unit: Unit, unit_order: dict, current_time: float):
        enemy_nearby = self.get_nearest_opposite_coalition_unit(patrol_unit, self.engagement_range)
        if enemy_nearby is None:
            return False

        enemy_id = getattr(enemy_nearby, "ID", None)
        last_enemy_id = unit_order.get("engagement_enemy_id")
        last_command_time = unit_order.get("last_engagement_command_time", 0.0)
        if enemy_id == last_enemy_id and current_time - last_command_time < self.engagement_duration_seconds:
            return False

        self._report_group_contact(group, current_time)
        self._start_patrol_engagement(patrol_unit, enemy_nearby)
        unit_order["engagement_enemy_id"] = enemy_id
        unit_order["last_engagement_command_time"] = current_time
        return True

    def _report_group_contact(self, group: Group, current_time: float):
        if current_time - group.last_contact_report_time < self.contact_report_cooldown_seconds:
            return

        group.last_contact_report_time = current_time
        self._transmit_response(f"{group.name}, CONTACT! Wait, Out!")
        group.pending_contact_detail_time = current_time + random.uniform(
            self.contact_detail_report_delay_min_seconds,
            self.contact_detail_report_delay_max_seconds,
        )
        group.pending_contact_detail_message = self._build_contact_detail_report(group)

    def _check_groups_for_extraction_requests(self):
        for group in self.groups:
            should_request_extraction, extraction_message = self._evaluate_group_extraction_need(group)
            if not should_request_extraction:
                group.extraction_requested = False
                continue

            if group.extraction_requested:
                continue

            group.extraction_requested = True
            self._transmit_response(extraction_message)

    def _evaluate_group_extraction_need(self, group: Group) -> tuple[bool, str | None]:
        live_units = []
        total_health = 0.0
        total_ammo = 0

        for squad_unit in group.units:
            current_unit = self._resolve_unit(squad_unit.ID)
            if current_unit is None or not current_unit.alive:
                continue

            live_units.append(current_unit)
            total_health += float(getattr(current_unit, "health", 0.0) or 0.0)
            total_ammo += int(getattr(current_unit, "total_ammo", 0) or 0)

        if not live_units:
            return False, None

        group.peak_total_ammo = max(group.peak_total_ammo, total_ammo)
        average_health = total_health / len(live_units)

        low_health = average_health <= self.extraction_health_threshold
        low_ammo = group.peak_total_ammo > 0 and total_ammo <= group.peak_total_ammo * self.extraction_ammo_ratio_threshold

        if not low_health and not low_ammo:
            return False, None

        if low_health and low_ammo:
            return True, f"{group.name}, we are below half strength and low on ammunition, requesting extraction."
        if low_health:
            return True, f"{group.name}, we are below half strength, requesting extraction."
        return True, f"{group.name}, we are running low on ammunition, requesting extraction."

    def _dispatch_pending_contact_reports(self):
        current_time = time.monotonic()
        for group in self.groups:
            due_time = group.pending_contact_detail_time
            message = group.pending_contact_detail_message
            if due_time is None or not message:
                continue
            if current_time < due_time:
                continue

            self._transmit_response(message)
            group.pending_contact_detail_time = None
            group.pending_contact_detail_message = None

    def _dispatch_pending_zone_search_reports(self):
        current_time = time.monotonic()
        for group in self.groups:
            due_time = group.pending_zone_search_report_time
            zone_name = group.pending_zone_search_report_message
            if due_time is None or not zone_name:
                continue
            if current_time < due_time:
                continue

            movement_order = group.movement_order or {}
            search_zone = movement_order.get("search_zone") or movement_order.get("target_zone")
            self._transmit_response(self._build_zone_search_report(group, search_zone, zone_name))
            group.pending_zone_search_report_time = None
            group.pending_zone_search_report_message = None
            self._transition_group_to_post_search_hold(group)

    def _handle_group_zone_search_arrival(self, group: Group):
        movement_order = group.movement_order or {}
        zone_name = movement_order.get("target_zone_name") or "the area"

        self._transmit_response(f"Squad {group.name} has reached {zone_name} and is now searching it.")
        movement_order["zone_search_started"] = True
        movement_order["zone_search_next_move_time"] = time.monotonic()
        group.pending_zone_search_report_time = time.monotonic() + random.uniform(
            self.zone_search_report_delay_min_seconds,
            self.zone_search_report_delay_max_seconds,
        )
        group.pending_zone_search_report_message = zone_name
        self._issue_group_zone_search_move(group, movement_order, time.monotonic(), force=True)

    def _transition_group_to_post_search_hold(self, group: Group):
        movement_order = group.movement_order or {}
        target_zone = movement_order.get("target_zone")
        movement_order["zone_search_enabled"] = False
        movement_order["zone_search_started"] = False
        movement_order["zone_search_next_move_time"] = None
        movement_order["zone_search_anchor"] = None

        hold_anchor = self._zone_location_to_latlng(target_zone)
        if hold_anchor is None:
            hold_anchor = self._get_group_average_position(group)

        self._start_group_hold_at_anchor(group, hold_anchor, None, hold_spread_radius=12.0)

    def _update_group_zone_search(self, group: Group, current_time: float):
        movement_order = group.movement_order or {}
        if not movement_order.get("zone_search_started"):
            return

        next_move_time = movement_order.get("zone_search_next_move_time")
        if next_move_time is None or current_time < next_move_time:
            return

        tracked_units = movement_order.get("units", {})
        if not tracked_units:
            return

        all_units_ready = True
        for unit_id, unit_order in tracked_units.items():
            patrol_unit = self._resolve_unit(unit_id)
            if patrol_unit is None or not patrol_unit.alive or patrol_unit.position is None:
                continue
            if unit_order.get("state") != "holding_final":
                all_units_ready = False
                break

        if not all_units_ready:
            return

        self._issue_group_zone_search_move(group, movement_order, current_time)

    def _issue_group_zone_search_move(self, group: Group, movement_order: dict, current_time: float, force: bool = False):
        target_zone = movement_order.get("search_zone") or movement_order.get("target_zone")
        search_anchor = self._build_zone_destination(
            target_zone,
            fallback_radius=max(self.zone_search_group_spread_radius * 2.0, self.destination_threshold * 2.0),
        )
        if search_anchor is None:
            return

        movement_order["zone_search_anchor"] = search_anchor
        movement_order["zone_search_next_move_time"] = current_time + random.uniform(
            self.zone_search_move_interval_min_seconds,
            self.zone_search_move_interval_max_seconds,
        )

        for squad_unit in group.units:
            current_unit = self._resolve_unit(squad_unit.ID)
            if not self._can_issue_patrol_order(current_unit):
                continue

            unit_order = movement_order.get("units", {}).get(str(current_unit.ID))
            if unit_order is None:
                continue

            search_destination = search_anchor.project_with_bearing_and_distance(
                random.uniform(0, self.zone_search_group_spread_radius),
                math.radians(random.uniform(0, 360)),
            )

            unit_order["final_destination"] = search_destination
            if current_unit.position.distance_to(search_destination) <= self.destination_threshold and not force:
                unit_order["step_destination"] = search_destination
                unit_order["state"] = "holding_final"
                continue

            next_step = self._get_next_step_destination(current_unit.position, search_destination)
            try:
                current_unit.unregister_on_destination_reached_callback()
            except Exception:
                pass

            current_unit.set_path([next_step])
            unit_order["step_destination"] = next_step
            unit_order["state"] = "moving"
            unit_order["engagement_end_time"] = None

    def _build_zone_search_report(self, group: Group, target_zone: dict | None, zone_name: str) -> str:
        zone_position = self._zone_location_to_latlng(target_zone)
        if zone_position is None:
            return f"{group.name}, {zone_name}, no firm indicators were found."

        enemy_units = self._get_enemy_units_within_radius(zone_position, self._get_group_enemy_coalition(group), 5000.0)
        if not enemy_units:
            return f"{group.name}, {zone_name}, no indicators of recent enemy presence."

        nearest_distance = min(zone_position.distance_to(enemy_unit.position) for enemy_unit in enemy_units if enemy_unit.position is not None)
        enemy_count = len(enemy_units)

        if nearest_distance <= 200.0:
            if enemy_count >= 6:
                assessment = "strong enemy presence in the village"
            else:
                assessment = "enemy presence in the village"
        elif nearest_distance <= 1000.0:
            if enemy_count >= 6:
                assessment = "the locals are very jumpy and there are strong indicators of nearby enemy presence"
            else:
                assessment = "the locals are jumpy and good indicators suggest nearby enemy presence, they may have been here recently or are nearby"
        elif nearest_distance <= 2500.0:
            assessment = "there are signs of enemy activity nearby, but nothing firm"
        elif nearest_distance <= 5000.0:
            assessment = "there are weak indicators of enemy presence in the wider area"
        else:
            assessment = "no indicators of recent enemy presence"

        return f"{group.name}, {zone_name}, {assessment}."

    def _build_contact_detail_report(self, group: Group) -> str:
        contact_unit, enemy_units = self._get_group_contact_snapshot(group)
        if contact_unit is None or not enemy_units:
            return f"{group.name}, contact report, grid unknown, enemy forces unknown, engaging."

        primary_enemy = enemy_units[0]
        grid_text = self._format_mgrs_for_readback(self._format_enemy_mgrs(primary_enemy.position)) or "unknown"
        enemy_force_text = self._describe_enemy_forces(enemy_units)
        return f"{group.name}, contact report, grid {grid_text}, {enemy_force_text}, engaging."

    def _get_group_contact_snapshot(self, group: Group) -> tuple[Unit | None, list[Unit]]:
        if self.api is None:
            return None, []

        for group_unit in group.units:
            patrol_unit = self._resolve_unit(group_unit.ID)
            if patrol_unit is None or not patrol_unit.alive or patrol_unit.position is None:
                continue

            primary_enemy = self.get_nearest_opposite_coalition_unit(patrol_unit, self.engagement_range)
            if primary_enemy is None or primary_enemy.position is None:
                continue

            enemy_units = self._get_enemy_units_near_position(primary_enemy.position, primary_enemy.coalition)
            if not enemy_units:
                enemy_units = [primary_enemy]
            return patrol_unit, enemy_units

        return None, []

    def _get_enemy_units_near_position(self, reference_position: LatLng, enemy_coalition: str) -> list[Unit]:
        if self.api is None:
            return []

        nearby_units = []
        cluster_radius = max(self.engagement_range, 300.0)
        for candidate_unit in self.api.get_units().values():
            if not candidate_unit.alive or candidate_unit.position is None:
                continue

            candidate_coalition = candidate_unit.operate_as if candidate_unit.operate_as in ["blue", "red"] else candidate_unit.coalition
            if candidate_coalition != enemy_coalition:
                continue

            if reference_position.distance_to(candidate_unit.position) > cluster_radius:
                continue

            nearby_units.append(candidate_unit)

        return nearby_units

    def _get_enemy_units_within_radius(self, reference_position: LatLng, enemy_coalition: str, radius: float) -> list[Unit]:
        if self.api is None:
            return []

        nearby_units = []
        for candidate_unit in self.api.get_units().values():
            if not candidate_unit.alive or candidate_unit.position is None:
                continue

            candidate_coalition = candidate_unit.operate_as if candidate_unit.operate_as in ["blue", "red"] else candidate_unit.coalition
            if candidate_coalition != enemy_coalition:
                continue

            if reference_position.distance_to(candidate_unit.position) > radius:
                continue

            nearby_units.append(candidate_unit)

        return nearby_units

    def _get_group_enemy_coalition(self, group: Group) -> str:
        for squad_unit in group.units:
            current_unit = self._resolve_unit(squad_unit.ID)
            if current_unit is None:
                continue

            unit_coalition = current_unit.operate_as if current_unit.operate_as in ["blue", "red"] else current_unit.coalition
            if unit_coalition == "red":
                return "blue"
            if unit_coalition == "blue":
                return "red"

        return "red"

    def _get_nearest_town_centre_zone(self, group: Group) -> dict | None:
        reference_position = self._get_group_average_position(group)
        if reference_position is None:
            return None

        town_centre_zones, _ = self._get_linkable_settlement_zones()
        if not town_centre_zones:
            return None

        return self._get_nearest_zone(reference_position, town_centre_zones)

    def _get_linkable_settlement_zones(self) -> tuple[list[dict], list[dict]]:
        if self.api is None:
            return [], []

        try:
            mission = self.api.update_mission()
        except Exception:
            mission = self.api.get_mission()

        if not isinstance(mission, dict):
            return [], []

        mission_triggers = mission.get("triggers", {})
        town_centres = []
        linked_search_zones = []
        for trigger in mission_triggers.values():
            zone_name = str(trigger.get("name", ""))
            if re.match(r"^[tT][cC]-.+-\d+$", zone_name):
                town_centres.append(trigger)
            elif re.match(r"^[sS][cC]-.+-\d+$", zone_name):
                linked_search_zones.append(trigger)
            elif re.match(r"^[sS][vV]-.+-\d+$", zone_name) or re.match(r"^[lL][vV]-.+-\d+$", zone_name) or re.match(r"^[sS][hH]-.+-\d+$", zone_name):
                linked_search_zones.append(trigger)

        self._link_named_zones_to_town_centres(linked_search_zones, town_centres)
        return town_centres, linked_search_zones

    def _link_named_zones_to_town_centres(self, search_zones: list[dict], town_centres: list[dict]) -> bool:
        try:
            for search_zone in search_zones:
                search_zone_name = search_zone.get("name", "").lower()
                search_zone_match = re.match(r"^(?:[sS][cC]|[sS][vV]|[lL][vV]|[sS][hH])-(.+)-\d+$", search_zone_name)
                if search_zone_match is None:
                    continue

                search_zone_stub = search_zone_match.group(1)
                for town_centre in town_centres:
                    town_centre_name = town_centre.get("name", "").lower()
                    town_centre_match = re.match(r"^[tT][cC]-(.+)-\d+$", town_centre_name)
                    if town_centre_match is None:
                        continue

                    town_centre_stub = town_centre_match.group(1)
                    if search_zone_stub == town_centre_stub:
                        search_zone["linked_town_centre_name"] = town_centre.get("name", "")
                        town_centre["linked_search_zone_name"] = search_zone.get("name", "")
                        if str(search_zone.get("name", "")).lower().startswith("sc-"):
                            town_centre["linked_priority_search_zone_name"] = search_zone.get("name", "")
            return True
        except Exception as error:
            self.logger.warning(f"Failed to link search zones to town centres: {error}")
            return False

    def _get_linked_zone_for_town_centre(self, town_centre: dict | None) -> dict | None:
        if not town_centre:
            return None

        town_centres, search_zones = self._get_linkable_settlement_zones()
        priority_zone_name = str(town_centre.get("linked_priority_search_zone_name", ""))
        linked_zone_name = str(town_centre.get("linked_search_zone_name", ""))
        town_centre_name = str(town_centre.get("name", ""))

        if town_centre_name:
            for candidate_town_centre in town_centres:
                if str(candidate_town_centre.get("name", "")) == town_centre_name:
                    priority_zone_name = str(candidate_town_centre.get("linked_priority_search_zone_name", priority_zone_name))
                    linked_zone_name = str(candidate_town_centre.get("linked_search_zone_name", linked_zone_name))
                    break

        for desired_name in (priority_zone_name, linked_zone_name):
            if not desired_name:
                continue
            for search_zone in search_zones:
                if str(search_zone.get("name", "")) == desired_name:
                    return search_zone

        return town_centre

    def _get_nearest_zone(self, zone_location, zones: list[dict]) -> dict | None:
        try:
            zone_lat, zone_lng = self._extract_lat_lng(zone_location)
            if zone_lat is None or zone_lng is None:
                return None

            nearest_zone = None
            nearest_distance = float("inf")
            for candidate_zone in zones:
                candidate_location = candidate_zone.get("location", {})
                candidate_lat, candidate_lng = self._extract_lat_lng(candidate_location)
                if candidate_lat is None or candidate_lng is None:
                    continue

                distance = math.sqrt((zone_lat - candidate_lat) ** 2 + (zone_lng - candidate_lng) ** 2)
                if distance < nearest_distance:
                    nearest_distance = distance
                    nearest_zone = candidate_zone

            return nearest_zone
        except Exception as error:
            self.logger.warning(f"Failed to find nearest zone: {error}")
            return None

    def _extract_lat_lng(self, point):
        try:
            if hasattr(point, "lat") and hasattr(point, "lng"):
                return float(point.lat), float(point.lng)
            if hasattr(point, "lat") and hasattr(point, "lon"):
                return float(point.lat), float(point.lon)
            if isinstance(point, dict) and "lat" in point:
                return float(point.get("lat")), float(point.get("lng", point.get("lon")))
        except Exception:
            return None, None
        return None, None

    def _zone_location_to_latlng(self, zone: dict | None) -> LatLng | None:
        if not zone:
            return None

        location = zone.get("location", {})
        try:
            return LatLng(
                float(location.get("lat")),
                float(location.get("lng", location.get("lon"))),
                float(location.get("alt", 0)),
            )
        except (TypeError, ValueError):
            return None

    def _build_zone_destination(self, zone: dict | None, fallback_radius: float = 0.0) -> LatLng | None:
        zone_position = self._zone_location_to_latlng(zone)
        if zone_position is None:
            return None

        radius = float(zone.get("radius", 0) or 0)
        if radius <= 0:
            radius = max(0.0, fallback_radius)
        if radius <= 0:
            return zone_position

        distance = random.uniform(0, radius)
        bearing = math.radians(random.uniform(0, 360))
        return zone_position.project_with_bearing_and_distance(distance, bearing)

    def _format_zone_name_for_speech(self, zone_name: str) -> str:
        if not zone_name:
            return "the area"

        match = re.match(r"^[tT][cC]-(.+)-\d+$", zone_name)
        if match is not None:
            zone_name = match.group(1)

        return zone_name.replace("_", " ").replace("-", " ")

    def _format_enemy_mgrs(self, position: LatLng | None) -> str:
        if position is None:
            return "unknown"

        try:
            longitude = self._get_position_lng(position)
            zone_number = self._utm_zone_from_longitude(longitude)
            easting, northing = self._latlng_to_utm(position.lat, longitude, zone_number)
            letters = self._utm_to_mgrs_letters(zone_number, easting, northing)
            easting_digits = int(easting % 100000) // 100
            northing_digits = int(northing % 100000) // 100
            return f"{letters} {easting_digits:03d} {northing_digits:03d}"
        except Exception:
            return "unknown"

    def _format_mgrs_for_readback(self, mgrs_text: str) -> str:
        if not mgrs_text or mgrs_text == "unknown":
            return "unknown"

        parts = mgrs_text.split()
        if len(parts) != 3:
            return mgrs_text

        letters, easting, northing = parts
        spoken_letters = [LETTER_TO_NATO.get(letter.upper(), letter.lower()) for letter in letters]
        spoken_digits = list(easting + northing)
        return " ".join(spoken_letters + spoken_digits)

    def _get_position_lng(self, position) -> float:
        if hasattr(position, "lng"):
            return position.lng
        if hasattr(position, "lon"):
            return position.lon
        raise AttributeError("Position has neither lng nor lon")

    def _describe_enemy_forces(self, enemy_units: list[Unit]) -> str:
        if not enemy_units:
            return "enemy forces unknown"

        counts = {}
        for enemy_unit in enemy_units[:8]:
            label = self._get_enemy_force_label(enemy_unit)
            counts[label] = counts.get(label, 0) + 1

        parts = []
        for label, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
            if count == 1:
                parts.append(label)
            else:
                parts.append(f"{count} {label}")

        if len(parts) == 1:
            return parts[0]
        if len(parts) == 2:
            return f"{parts[0]} and {parts[1]}"
        if not parts:
            return "enemy forces unknown"

        leading = ", ".join(parts[:-1])
        return f"{leading}, and {parts[-1]}"

    def _get_enemy_force_label(self, enemy_unit: Unit) -> str:
        enemy_text = " ".join(
            filter(
                None,
                [
                    str(getattr(enemy_unit, "type", "") or "").lower(),
                    str(getattr(enemy_unit, "name", "") or "").lower(),
                    str(getattr(enemy_unit, "pilot", "") or "").lower(),
                ],
            )
        )

        if any(token in enemy_text for token in ["inf", "infantry", "soldier", "ak", "ins", "viet", "vc"]):
            return random.choice(["enemy infantry", "infantry", "vc", "vietcong"])

        if any(token in enemy_text for token in ["tank", "armor", "armour", "bmp", "btr", "apc", "ifv"]):
            return random.choice(["enemy armor", "armor", "armored vehicles"])

        if any(token in enemy_text for token in ["aaa", "sam", "sa-", "strela", "shilka", "zu-", "air defense"]):
            return random.choice(["enemy air defense", "air defense", "triple a"])

        if any(token in enemy_text for token in ["truck", "transport", "logistics", "supply"]):
            return random.choice(["enemy vehicles", "support vehicles", "transport vehicles"])

        if any(token in enemy_text for token in ["helicopter", "helo", "hind", "hip", "ka-"]):
            return random.choice(["enemy helicopters", "helicopters"])

        if any(token in enemy_text for token in ["aircraft", "fighter", "mig", "su-", "jet"]):
            return random.choice(["enemy aircraft", "aircraft", "fast air"])

        return random.choice(["enemy forces", "enemy units", "hostile forces"])

    def _utm_zone_from_longitude(self, longitude: float) -> int:
        return int((longitude + 180) // 6) + 1

    def _latlng_to_utm(self, lat: float, lng: float, zone_number: int):
        wgs84_a = 6378137.0
        wgs84_f = 1 / 298.257223563
        wgs84_e2 = wgs84_f * (2 - wgs84_f)
        wgs84_e2_prime = wgs84_e2 / (1 - wgs84_e2)
        utm_k0 = 0.9996

        lat_rad = math.radians(lat)
        lng_rad = math.radians(lng)
        central_meridian = math.radians((zone_number - 1) * 6 - 180 + 3)

        sin_lat = math.sin(lat_rad)
        cos_lat = math.cos(lat_rad)
        tan_lat = math.tan(lat_rad)

        n = wgs84_a / math.sqrt(1 - wgs84_e2 * sin_lat * sin_lat)
        t = tan_lat * tan_lat
        c = wgs84_e2_prime * cos_lat * cos_lat
        a = cos_lat * (lng_rad - central_meridian)

        m = wgs84_a * (
            (1 - wgs84_e2 / 4 - 3 * (wgs84_e2 ** 2) / 64 - 5 * (wgs84_e2 ** 3) / 256) * lat_rad
            - (3 * wgs84_e2 / 8 + 3 * (wgs84_e2 ** 2) / 32 + 45 * (wgs84_e2 ** 3) / 1024) * math.sin(2 * lat_rad)
            + (15 * (wgs84_e2 ** 2) / 256 + 45 * (wgs84_e2 ** 3) / 1024) * math.sin(4 * lat_rad)
            - (35 * (wgs84_e2 ** 3) / 3072) * math.sin(6 * lat_rad)
        )

        easting = utm_k0 * n * (
            a
            + (1 - t + c) * (a ** 3) / 6
            + (5 - 18 * t + t * t + 72 * c - 58 * wgs84_e2_prime) * (a ** 5) / 120
        ) + 500000.0

        northing = utm_k0 * (
            m
            + n * tan_lat * (
                (a ** 2) / 2
                + (5 - t + 9 * c + 4 * c * c) * (a ** 4) / 24
                + (61 - 58 * t + t * t + 600 * c - 330 * wgs84_e2_prime) * (a ** 6) / 720
            )
        )

        if lat < 0:
            northing += 10000000.0

        return easting, northing

    def _utm_to_mgrs_letters(self, zone_number: int, easting: float, northing: float) -> str:
        mgrs_column_sets = ("ABCDEFGH", "JKLMNPQR", "STUVWXYZ")
        mgrs_row_letters = "ABCDEFGHJKLMNPQRSTUV"

        set_number = zone_number % 6 or 6
        column_set = mgrs_column_sets[(set_number - 1) % 3]
        column_index = max(0, min(7, int(easting // 100000) - 1))
        first_letter = column_set[column_index]

        row_shift = 0 if set_number in (1, 3, 5) else 5
        row_index = (int(northing // 100000) + row_shift) % 20
        second_letter = mgrs_row_letters[row_index]
        return f"{first_letter}{second_letter}"

    def _advance_patrol_unit_to_next_step(self, patrol_unit: Unit, unit_order: dict):
        final_destination = unit_order.get("final_destination")
        if final_destination is None:
            unit_order["state"] = "inactive"
            return

        next_step = self._get_next_step_destination(patrol_unit.position, final_destination)
        patrol_unit.set_path([next_step])
        unit_order["step_destination"] = next_step
        unit_order["state"] = "moving"
        unit_order["engagement_end_time"] = None

    def _start_patrol_engagement(self, patrol_unit: Unit, enemy_nearby: Unit):
        patrol_unit.simulate_engagement()
        patrol_unit.set_shots_scatter(random.randint(2, 3))
        patrol_unit.set_shots_intensity(random.randint(1, 3))
        self.logger.info(
            f"Friendly patrol unit {patrol_unit.ID} is engaging enemy {enemy_nearby.ID} while executing movement orders."
        )

    def _can_issue_patrol_order(self, patrol_unit: Unit | None) -> bool:
        if patrol_unit is None or not patrol_unit.alive:
            return False
        if patrol_unit.position is None:
            return False
        return True

    def _build_final_destination(
        self,
        patrol_unit: Unit,
        command_unit: Unit,
        patrol_direction: str,
        bearing: float | None,
        distance: float | None,
        target_zone: dict | None = None,
    ) -> LatLng | None:
        if patrol_unit.position is None or command_unit.position is None:
            return None

        if patrol_direction == "to your location":
            return LatLng(command_unit.position.lat, self._get_position_lng(command_unit.position), command_unit.position.alt)

        if patrol_direction == "to nearby settlement":
            return self._build_zone_destination(target_zone)

        if bearing is None or distance is None:
            return None

        return patrol_unit.position.project_with_bearing_and_distance(distance, bearing)

    def _get_next_step_destination(self, current_position: LatLng, final_destination: LatLng) -> LatLng:
        remaining_distance = current_position.distance_to(final_destination)
        if remaining_distance <= self.patrol_step_distance:
            return final_destination

        bearing = current_position.bearing_to(final_destination)
        return current_position.project_with_bearing_and_distance(self.patrol_step_distance, bearing)

    def get_nearest_opposite_coalition_unit(self, unit_object: Unit, max_distance: float = 10000):
        if self.api is None:
            return None

        if unit_object.operate_as == "blue" or unit_object.coalition == "blue":
            enemy_coalition = "red"
        elif unit_object.operate_as == "red" or unit_object.coalition == "red":
            enemy_coalition = "blue"
        else:
            return None

        nearest_unit = None
        nearest_distance = max_distance

        for candidate_unit in self.api.get_units().values():
            if not candidate_unit.alive or candidate_unit.position is None:
                continue

            candidate_coalition = candidate_unit.operate_as if candidate_unit.operate_as in ["blue", "red"] else candidate_unit.coalition
            if candidate_coalition != enemy_coalition:
                continue

            category_name = str(candidate_unit.category).lower()
            if category_name not in ["ground", "groundunit", "aircraft", "helicopter"]:
                continue

            distance = unit_object.position.distance_to(candidate_unit.position)
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_unit = candidate_unit

        return nearest_unit

    def roundup(self, x):
        return int(math.ceil(x / 10.0)) * 10
    