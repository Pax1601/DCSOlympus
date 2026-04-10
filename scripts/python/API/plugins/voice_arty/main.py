"""
Voice-controlled artillery plugin for DCS Olympus API.
"""
import math
import random
import re
import sys
from pathlib import Path

from data.data_types import LatLng
from unit.unit import Unit
from weapon.weapon import Weapon

api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from plugin_base import Plugin
try:
    from .mgrs_utils import extract_mgrs_100k, format_grid_for_readback, mgrs_100k_to_latlng
    from .speech_normalizer import normalize_common_phrases
except ImportError:
    from mgrs_utils import extract_mgrs_100k, format_grid_for_readback, mgrs_100k_to_latlng
    from speech_normalizer import normalize_common_phrases

class VoiceArty(Plugin):
    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)

        self.config = global_config.get("plugin_settings", {}).get(plugin_info.get("name"), {})
        self.update_interval = float(self.config.get("update_interval", 1.0))
        self.frequency = float(self.config.get("frequency_hz", 33.000e6))
        self.battery_callsign = str(self.config.get("battery_callsign", "Hammer"))
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
        }
        
        # Target tracking
        self.target_counter = 0
        self.stored_targets = {}  # Maps target_number -> {location, unit_id, timestamp}
        self.nato_phonetic = [
            "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
            "Golf", "Hotel", "India", "Juliett", "Kilo", "Lima",
            "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo",
            "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "Xray",
            "Yankee", "Zulu"
        ]
        self.target_second_letter_offset = random.randint(1, len(self.nato_phonetic) - 1)

        self.firing_units: set[Unit] = set()  
        self.tracked_shells: set[Weapon] = set()  # Keep track of shells we've registered callbacks for
        self.gun_targets: dict[int, LatLng] = {}  # Maps gun unit ID to current target LatLng

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
            self.stored_targets.clear()
            self.target_counter = 0
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

        battery_units = self._get_battery_units()

        # Iterate over the existing weapons and check the launcher ID to retrieve the firing unit
        for weapon in api.get_weapons().values():
            # Check that the shell has not exploded already
            if not weapon.alive:
                continue

            # Check if we are already tracking the shell. If so, skip, else add it to the tracked shells.
            if weapon in self.tracked_shells:
                continue
            self.tracked_shells.add(weapon)
            self.logger.info(f"Tracking new shell from unit {weapon.launcher_ID}, weapon ID {weapon.ID}.")

            # Get the firing unit
            firing_unit = next((unit for unit in battery_units if unit.ID == weapon.launcher_ID), None)
            if firing_unit is None:
                self.logger.warning(f"Could not find firing unit for weapon ID {weapon.ID} with launcher ID {weapon.launcher_ID}")
                continue
            
            # Check if the unit has already been registered
            if firing_unit in self.firing_units:
                self.logger.info(f"Unit {firing_unit.ID} is already in firing units set, skipping callback registration.")
                continue

            # Check if the target of this firing unit is the same as one of the already registered firing units. If so, skip this unit as we will already have a callback registered.
            # This is used to avoid reporting multiple shots from different units from the same battery
            already_registered_unit_with_same_target = next((unit for unit in self.firing_units if self.gun_targets.get(unit.ID) == self.gun_targets.get(firing_unit.ID)), None)
            if already_registered_unit_with_same_target:
                self.logger.info(f"Unit {firing_unit.ID} has same target as already registered unit {already_registered_unit_with_same_target.ID}, skipping callback registration.")
                continue

            # Get the target of the firing unit
            target = self.gun_targets.get(firing_unit.ID)
            if target is None:
                self.logger.warning(f"No target location found in state for firing unit {firing_unit.ID}, skipping callback registration.")
                continue

            # Register a callback for when the position of the shell changes. Register the unit as a firing unit. Report the shot.
            weapon.register_on_property_change_callback("position", lambda weapon, position, target=target: self._on_shell_position_change(weapon, position, target))
            self.firing_units.add(firing_unit)
            self.logger.info(f"Unit {firing_unit.ID} added to firing units set.")
            self._send_voice(f"Shot, over.")

        # Iterate over the firing units.
        for unit in list(self.firing_units):
            # Safety check, ignore dead units
            if not unit.alive:
                self.firing_units.remove(unit)
                self.logger.info(f"Unit {unit.ID} is no longer alive, removing from firing units set.")
                continue

            # If the unit is still firing, wait
            if not unit.state == "idle":
                continue

            # Get all the shells that were shot from this unit and check if any of them is still alive. If so, wait
            tracked_shells_from_unit = [weapon for weapon in self.tracked_shells if weapon.launcher_ID == unit.ID and weapon.alive]
            if any(weapon.alive for weapon in tracked_shells_from_unit):
                continue

            # If the unit is in idle state and there are no more shells from it in the air we can safely remove it from the firing units set to be ready to track the next shot from it
            self.firing_units.remove(unit)
            self.logger.info(f"Unit {unit.ID} is idle and has no tracked shells, removing from firing units set.")

    def _on_message_received(self, recognized_text: str, unit_id: str):
        if not self.running or self.paused or self.api is None or self.listener is None:
            return

        message = recognized_text.lower()
        normalized_message = self._normalize_intent_text(message)
        unit_name = self._resolve_callsign(unit_id)
        state = self.state_by_unit.setdefault(
            unit_id,
            {
                "phase": "1", #should be 1 at start
                "observer_id": "",
                "warning_order": "",
                "warnord_type": "",

                #Types of warnord mission
                "adjust_fire": False, #should be false at start
                # "fire_for_effect": False,
                # "suppress": False,
                # "smoke": False,
                # "illumination": False,

                #method of target location
                "grid": False,
                "grid_location": "",
                # "polar": False,
                # "polar_location": "",
                # "polar_direction": "",
                # "polar_distance": "",
                # "shift_from_known_point": False,
                # "shift_from_known_point_location": "",
                # "shift_from_known_point_direction": "",
                # "shift_from_known_point_distance": "",

                #target description
                "valid_target": False,
                "target_location": None,
                # "target_type": "",
                # "target_doing": "",
                # "target_element": "",
                # "target_protection": "",
                # "target_shape": "", #rectangle 400 by 200, circle radius 200, linear length 400

                # #method of engagement
                # "how_to_attack": "",
                # "danger_close": False,
                # "mark": False,

                # #type of adjustment
                # "area_fire": False,
                # "precision_fire": False,
                # "trajectory": "",
                # "low_angle": True, # this is default
                # "high_angle": False, # not possible in DCS
                # "ammunition_type": "", #irrelevant in DCS unless Smoke / Illum
                # "followed_by": False #whether a mission is followed by another one, e.g. WP followed by HE
                # "followed_by_type": "", #if followed_by is True, what type of mission is next
                # "projectile": "", #not implemented in DCS
                # "fuze": "", #not implemented in DCS
                # "volume_of_fire": 1, #number of rounds to fire by gun, default is one

                # #distribution
                # "distribution": "", #not yet implemented, can be various shapes, times, quadrants and loads of complex crap

                # #method of fire and control
                "method_of_fire": False, #the default to adjust fire is 1 gun, but it doesn't have to be e.g. 2 guns in adjust or platoon, battery right etc.
                "method_of_fire_description": "", #if method_of_fire is True, this describes how to fire
                "method_of_control": False, #fire when ready is standard, otherwise can be other options but we can't do in DCS
                "method_of_control_description": "", #if method_of_control is True, other option may be "at my command", "fire" "cancel at my command, over"
                "mto_passed": False,
                "mto_readback_correctly": False,
                # #observation of stuff
                # "cannot_observe": False, #observer can't see target so states as much
                # "time_on_target": False, #requests the time for the rounds to impact the target e.g. time on target 0859 over, not implemented yet
                # "time_to_target": False, #requests the time for the rounds to impact the target e.g. time to target 2 minutes after the hack, not implemented yet
                # "co_ordinated_illumination": False, #requests illumination to be co-ordinated with the impact of the rounds, not implemented yet
                # "continous_illumination": False, #requests illumination to be continuous from the time of firing to the impact of the rounds, not implemented yet

                # #cancelling of shots or firing again
                "cease_loading": False, #means the guns fire the next shell, but then stop, this is standard for DCS but only true if triggered and stops all missions
                "check_fire": False, #means the guns stop and unload the next shell after the command check firing, not sure we can do this in DCS
                "continuous_fire": False, #means not to stop until given cease fire or check fire
                "repeat": False, #means to repeat the last mission, not implemented yet, can also have corrections e.g. a FFE mission ends 200 RIGHT REPEAT does it again 200m right
                
                # #other params
                "request_splash": True, #sends a splash fire seconds before impact, has to be true for airborne requests, not implemented to check for ground unless requested yet
                "do_not_load": False, #not relevant for DCS
                "duration": False, #used for suppresion and smoke missions, not implemented yet, can be in minutes or seconds
                "duration_time": "", #if duration is used, this describes the duration time in minutes or seconds
                "target_data": None, #stores target data such as location and phonetic for later retrieval if needed
                "direction_mils": None,

            },
        )

        if message == "":
            self._send_voice(f"Say again.")
            return

        try:
            if state["phase"] == "1":
                #############################
                #PHASE 1#####################
                #############################
                #Code to check for phase 1 which covers observer id and warning order
                self._set_prompt_if_supported(
                    (
                        "The following are valid message formats: "
                        f"{self.battery_callsign}, {unit_name}, adjust fire, over."
                        f"{self.battery_callsign}, {unit_name}, fire for effect, over."
                        f"{self.battery_callsign}, {unit_name}, suppression, over."
                        f"{self.battery_callsign}, {unit_name}, smoke, over."
                        f"{self.battery_callsign}, {unit_name}, illumination, over."
                        f"{self.battery_callsign}, {unit_name}, reset, over."
                    )
                )

                if "adjust" in normalized_message or "just" in normalized_message:
                    if "grid" in normalized_message:
                        self._send_voice(f"{unit_name}, {self.battery_callsign}, adjust fire, grid, out.")
                        #we set the method to be grid
                        state["adjust_fire"] = True
                        state["method_of_fire"] = True #grid is default
                        state["grid"] = True
                        state["grid_location"] = None #we don't know the grid yet
                        state["phase"] = "2"
                        return
                    elif "polar" in normalized_message:
                        self._send_voice(f"{unit_name}, {self.battery_callsign}, adjust fire, polar. Polar is not yet supported.")
                        return
                    elif "shift" in normalized_message:
                        self._send_voice(f"{unit_name}, {self.battery_callsign}, adjust fire, shift from known point. Shift from known point is not yet supported.")  
                        return
                    else: #grid is default for adjust fire
                        self._send_voice(f"{unit_name}, {self.battery_callsign}, adjust fire, out.")
                        state["adjust_fire"] = True
                        state["method_of_fire"] = True #grid is default
                        state["grid"] = True
                        state["grid_location"] = None #we don't know the grid yet
                        state["phase"] = "2"
                        return
                elif "effect" in normalized_message:
                    self._send_voice(f"{unit_name}, {self.battery_callsign}, fire for effect is not yet supported.")
                    return
                elif "suppress" in normalized_message or "suppression" in normalized_message:
                    self._send_voice(f"{unit_name}, {self.battery_callsign}, suppression is not yet supported.")
                    return
                elif "smoke" in normalized_message:
                    self._send_voice(f"{unit_name}, {self.battery_callsign}, smoke is not yet supported.")
                    return
                elif "illumination" in normalized_message:
                    self._send_voice(f"{unit_name}, {self.battery_callsign}, illumination is not yet supported.")
                    return
                elif "reset" in normalized_message:
                    self._send_voice(f"{unit_name}, {self.battery_callsign}, reseting call for fire, say again mission type when ready, out.")
                    return
                else:
                    self._send_voice(f"Say again for, {self.battery_callsign}.")
                    return    
                #end of 1st transmission code that covers observer id and warning order
            elif state["phase"] == "2":
                #############################
                #PHASE 2#####################
                #############################
                #phase 2 which covers the second transmission, containing target location code
                                #Code to check for phase 1 which covers observer id and warning order
                self._set_prompt_if_supported(
                    (
                        "Transmit target location in this format: grid, two NATO letters, then digits, over. "
                        "Example 8-digit: grid alpha bravo 1 2 3 4 5 6 7 8, over. "
                        "Example 6-digit: grid charlie delta 9 8 7 6 5 4, over. "
                        "Example 10-digit: grid echo foxtrot 1 2 3 4 5 9 8 7 6 5, over. "
                        "Speak each letter using NATO phonetics only. "
                        "NATO letters are: alpha bravo charlie delta echo foxtrot golf hotel india juliett kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu. "
                        "Use correction to amend a previous transmission."
                    )
                )
                #for speed testing only
                #normalized_message = "grid Bravo Quebec 558 686 altitude 1 2 0 meters"
                #comment above if not testing
                if "grid" in normalized_message:
                    grid = extract_mgrs_100k(normalized_message)
                    if not grid:
                        self._send_voice(
                            f"Say again, grid for {self.battery_callsign}."
                        )
                        return

                    target_latlng = self._grid_to_target_latlng(grid)
                    state["valid_target"] = True
                    state["target_location"] = target_latlng

                    if "altitude" in normalized_message:
                        altitude = re.search(r"altitude\s+((?:\d\s*){1,6})", normalized_message)
                        if altitude:
                            altitude_digits = re.sub(r"\s+", "", altitude.group(1))
                            altitude = "altitude " + str(int(altitude_digits)) + " meters"
                        else:
                            altitude = ""
                    else:
                        altitude = ""

                    self._send_voice(f"Grid {format_grid_for_readback(grid)}, {altitude}, out.")
                    state["phase"] = "3"
                    return
                else:
                    self._send_voice(f"Say again target location for, {self.battery_callsign}.")
                    return
                #end of 2nd transmission code that covers target location
            elif state["phase"] == "3":
                if state["valid_target"]:
                    if "correction" in normalized_message:
                        self._send_voice(f"Send target grid correction as full message again, out.")
                        state["phase"] = "2"
                        return
                    elif "target" in normalized_message and "over" in normalized_message:
                        target_data = self._generate_target_no(target_location=state["target_location"])
                        MTO = f"Message to observer, {self.battery_callsign}, Apache, 1 round, target {target_data['phonetic']}, over."
                        match_after_target_word = re.search(r"target (.*) over", normalized_message)                              
                        self._send_voice(f"Target, {match_after_target_word.group(1)}, out. {MTO}")
                        state["phase"] = "4"
                        return
                    elif "target" in normalized_message and "over" in normalized_message:
                        target_data = self._generate_target_no(target_location=state["target_location"])
                        state["target_data"] = target_data
                        MTO = f"Message to observer, {self.battery_callsign}, Apache, 1 round, target {target_data['phonetic']}, over."
                        match_after_target_word = re.search(r"target (.*) over", normalized_message)                              
                        self._send_voice(f"Target, {match_after_target_word.group(1)}, out. {MTO}")
                        state["phase"] = "4"
                        return
                    elif "target" in normalized_message:
                        target_data = self._generate_target_no(target_location=state["target_location"])
                        MTO = f"Message to observer, {self.battery_callsign}, Apache, 1 round, target {target_data['phonetic']}, over."
                        match_after_target_word = re.search(r"target (.*)", normalized_message)                              
                        self._send_voice(f"Target, {match_after_target_word.group(1)}, out. {MTO}")
                        state["phase"] = "4"
                        return                           
                else:
                    self._send_voice(f"Debug voice no valid target we can't shoot in phase 3, something went wong going back to phase 2")
                    state["phase"] = "2"
                    return

            elif state["phase"] == "4":
        
                if "direction" in normalized_message:
                    mils_direction = self._extract_mils_direction(normalized_message)
                    if mils_direction is None:
                        self._send_voice(f"Say again direction in mils for, {self.battery_callsign}.")
                        return

                    direction_spoken = " ".join(str(mils_direction).zfill(4))
                    amended_target = self._amend_target_by_mils(
                        state["target_location"],
                        mils_direction,
                    )
                    state["target_location"] = amended_target
                    state["direction_mils"] = mils_direction
                    self._send_voice(f"Direction {direction_spoken}, out.")

                    target_latlng = state["target_location"]
                    self._fire_artillery(target_latlng, 1, 1, True)
                    state["phase"] = "5"
                    return
                else:
                    self._send_voice(f"Say again direction in mils for, {self.battery_callsign}.")
                    return
                  
                
            elif state["phase"] == "5":                
                if "end" in normalized_message or "mission" in normalized_message:
                    if "target" in normalized_message or "record" in normalized_message:
                        self._send_voice(f"End of mission, record as target out.")
                        state["phase"] = "1"
                        return
                    else:
                        self._send_voice(f"Copy, end of mission out.")
                        state["phase"] = "1"
                        return
                elif "correction" in normalized_message or "add" in normalized_message or "drop" in normalized_message or "left" in normalized_message or "right" in normalized_message:
                    add_distance = 0
                    drop_distance = 0
                    left_distance = 0
                    right_distance = 0
                    target_latlng = state["target_location"]

                    if "add" in normalized_message:
                        add_distance_match = re.search(r"add\s+((?:\d\s*){1,6})", normalized_message)
                        if add_distance_match:
                            add_distance = int(add_distance_match.group(1).replace(" ", ""))
                        current_target_pos = state["target_location"]
                        target_latlng = current_target_pos.project_with_bearing_and_distance(add_distance, (state["direction_mils"] % 6400) * (2.0 * math.pi / 6400.0))
                        state["target_location"] = target_latlng

                    if "drop" in normalized_message:
                        drop_distance_match = re.search(r"drop\s+((?:\d\s*){1,6})", normalized_message)
                        if drop_distance_match:
                            drop_distance = int(drop_distance_match.group(1).replace(" ", ""))
                        current_target_pos = state["target_location"]
                        target_latlng = current_target_pos.project_with_bearing_and_distance(drop_distance, ((state["direction_mils"] + 3200) % 6400) * (2.0 * math.pi / 6400.0))
                        state["target_location"] = target_latlng

                    if "right" in normalized_message:
                        right_distance_match = re.search(r"right\s+((?:\d\s*){1,6})", normalized_message)
                        if right_distance_match:
                            right_distance = int(right_distance_match.group(1).replace(" ", ""))
                        current_target_pos = state["target_location"]
                        target_latlng = current_target_pos.project_with_bearing_and_distance(right_distance, ((state["direction_mils"] + 1600) % 6400) * (2.0 * math.pi / 6400.0))
                        state["target_location"] = target_latlng

                    if "left" in normalized_message:
                        left_distance_match = re.search(r"left\s+((?:\d\s*){1,6})", normalized_message)
                        if left_distance_match:
                            left_distance = int(left_distance_match.group(1).replace(" ", ""))
                        current_target_pos = state["target_location"]
                        target_latlng = current_target_pos.project_with_bearing_and_distance(left_distance, ((state["direction_mils"] + 4800) % 6400) * (2.0 * math.pi / 6400.0))
                        state["target_location"] = target_latlng
                    
                    if add_distance == 0 and drop_distance == 0 and left_distance == 0 and right_distance == 0:
                        self._send_voice(f"Say again correction.")
                        return
                    elif add_distance > 0 and left_distance == 0 and right_distance == 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Add {add_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Add {add_distance}, out.")
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    elif drop_distance > 0 and left_distance == 0 and right_distance == 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Drop {drop_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Drop {drop_distance}, out.")#
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    elif add_distance == 0 and drop_distance == 0 and right_distance > 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Right {right_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Right {right_distance}, out.")
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    elif add_distance == 0 and drop_distance == 0 and left_distance > 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Left {left_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Left {left_distance}, out.")
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    elif add_distance > 0 and right_distance > 0 and left_distance == 0 and drop_distance == 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Add {add_distance}, right {right_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Add {add_distance}, right {right_distance}, out.")
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    elif add_distance > 0 and left_distance > 0 and right_distance == 0 and drop_distance == 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Add {add_distance}, left {left_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Add {add_distance}, left {left_distance}, out.")
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    elif drop_distance > 0 and right_distance > 0 and left_distance == 0 and add_distance == 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Drop {drop_distance}, right {right_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Drop {drop_distance}, right {right_distance}, out.")
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    elif drop_distance > 0 and left_distance > 0 and right_distance == 0 and add_distance == 0:
                        if "effect" in normalized_message:
                            self._send_voice(f"Drop {drop_distance}, left {left_distance}, fire for effect, out.")
                            self._fire_artillery(state["target_location"], 5, 1, True)
                        else:
                            self._send_voice(f"Drop {drop_distance}, left {left_distance}, out.")
                            self._fire_artillery(state["target_location"], 1, 1, True)
                    else:
                        self._send_voice(f"Say again correction.")  

                elif "shot" in normalized_message or "splash" in normalized_message:
                    pass
                elif "repeat" in normalized_message:
                    self._send_voice(f"Repeat, out.")
                    self._fire_artillery(state["target_location"], 1, 1, True)
                elif "effect" in normalized_message:
                    self._send_voice(f"Fire for effect, out.")
                    self._fire_artillery(state["target_location"], 5, 1, False)
                else:
                    pass

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

    def _fire_artillery(self, target_latlng,shots=1,radius=0,singleshot=False):
        if target_latlng is None:
            self.logger.warning("No target position available for fire mission")
            return

        for unit in self.api.get_units().values():
            if unit.name == self.artillery_fire_unit_name and unit.coalition == self.friendly_coalition:
                self.logger.info(f"UNIT NAME: {unit.name}, SHOTS: {shots}, RADIUS: {radius}")
                unit.fire_at_area(target_latlng, shots, radius)
                self.gun_targets[unit.ID] = target_latlng
                if singleshot:
                    break

    def _send_voice(self, text: str):
        if self.api is None or self.listener is None:
            return

        try:
            future = self.api.generate_audio_message_in_executor(text, voice=self.voice)
            future.add_done_callback(lambda f: self.listener.transmit_on_frequency(file_name=f.result()))
            
        except Exception as error:
            self.logger.error(f"Failed to transmit voice response: {error}", exc_info=True)

    def _extract_mils_direction(self, normalized_message: str):
        # Accept both compact and spaced digit direction formats, e.g. 6400 or 6 4 0 0.
        match = re.search(r"direction\s+((?:\d\s*){1,4})", normalized_message)
        if not match:
            return None

        mils_text = re.sub(r"\s+", "", match.group(1))
        if not mils_text.isdigit():
            return None

        mils_value = int(mils_text)
        if mils_value < 0 or mils_value > 6400:
            return None
        return mils_value

    def _amend_target_by_mils(self, target_latlng: LatLng, mils_direction: int, distance_meters: float = None):
        if target_latlng is None:
            return None

        if distance_meters is None:
            distance_meters = float(self.config.get("direction_amend_distance_m", 100.0))

        # NATO mils conversion: 6400 mils == 360 degrees.
        bearing_radians = (mils_direction % 6400) * (2.0 * math.pi / 6400.0)
        return target_latlng.project_with_bearing_and_distance(distance_meters, bearing_radians)

    def _extract_meter_value(self, normalized_message: str, keyword: str):
        # Accept compact or spaced digits, e.g. "add 100" or "add 1 0 0".
        match = re.search(rf"{keyword}\s+((?:\d\s*){{1,5}})", normalized_message)
        if not match:
            return 0

        meters_text = re.sub(r"\s+", "", match.group(1))
        if not meters_text.isdigit():
            return 0
        return int(meters_text)

    def _apply_correction_to_target(self, target_latlng: LatLng, direction_mils: int, normalized_message: str):
        if target_latlng is None:
            return None

        base_bearing = (direction_mils % 6400) * (2.0 * math.pi / 6400.0)

        add_m = self._extract_meter_value(normalized_message, "add")
        drop_m = self._extract_meter_value(normalized_message, "drop")
        left_m = self._extract_meter_value(normalized_message, "left")
        right_m = self._extract_meter_value(normalized_message, "right")

        if add_m == 0 and drop_m == 0 and left_m == 0 and right_m == 0:
            return None

        updated = target_latlng
        if add_m > 0:
            updated = updated.project_with_bearing_and_distance(add_m, base_bearing)
        if drop_m > 0:
            updated = updated.project_with_bearing_and_distance(drop_m, base_bearing + math.pi)
        if right_m > 0:
            updated = updated.project_with_bearing_and_distance(right_m, base_bearing + (math.pi / 2.0))
        if left_m > 0:
            updated = updated.project_with_bearing_and_distance(left_m, base_bearing - (math.pi / 2.0))

        return updated

    def _generate_target_no(self, target_location=None):
        # Generate letter pair index (cycles through 26x26 = 676 combinations)
        letter_pair_index = self.target_counter // 10000
        first_letter_index = (letter_pair_index // 26) % 26
        second_letter_index = (first_letter_index + self.target_second_letter_offset) % len(self.nato_phonetic)

        
        # Generate four-digit number (1000-9999)
        four_digit = 1000 + (self.target_counter % 10000)
        
        first_letter = self.nato_phonetic[first_letter_index]
        second_letter = self.nato_phonetic[second_letter_index]
        
        # Normal format: "Alpha Charlie 1000"
        target_number = f"{first_letter} {second_letter} {four_digit}"
        
        # Phonetic format for voice: "Alpha Charlie 1 0 0 0"
        four_digit_str = str(four_digit)
        phonetic_digits = " ".join(four_digit_str)
        target_phonetic = f"{first_letter} {second_letter} {phonetic_digits}"
        
        # Store target with location for later retrieval
        self.stored_targets[target_number] = {
            "location": target_location,
            "sequence": self.target_counter,
            "target_phonetic": target_phonetic
        }
        
        self.target_counter += 1
        
        return {
            "target": target_number,
            "phonetic": target_phonetic
        }
    
    def _get_stored_target(self, target_number: str) -> dict:
        """Retrieves a previously generated target by its number."""
        return self.stored_targets.get(target_number, None)
    
    def _list_stored_targets(self) -> dict:
        """Returns all stored targets."""
        return self.stored_targets.copy()

    def _set_prompt_if_supported(self, prompt_text: str):
        if self.listener is None:
            return

        set_prompt_fn = getattr(self.listener, "set_prompt", None)
        if callable(set_prompt_fn):
            set_prompt_fn(prompt_text)

    def _normalize_intent_text(self, text: str) -> str:
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        normalized_tokens = [self.intent_token_map.get(token, token) for token in tokens]
        return normalize_common_phrases(" ".join(normalized_tokens))
    
    def _get_battery_units(self):
        battery_units: list[Unit] = []
        for unit in self.api.get_units().values():
            if unit.name == self.artillery_fire_unit_name and unit.coalition == self.friendly_coalition:
                battery_units.append(unit)
        return battery_units
            
    def _on_shell_position_change(self, weapon: Weapon, position: LatLng, target: LatLng):
        # Check if the shell is within 5 seconds of impact
        time_to_impact = position.distance_to(target) / weapon.speed if weapon.speed > 0 else float('inf')
        if time_to_impact <= 5.0:  
            self.logger.info(f"Shell impact projected in 5 seconds for weapon {weapon.name}.")
            self._send_voice(f"Splash, over.")

            # Remove the callback after it has triggered to avoid multiple calls for the same shell
            weapon.unregister_on_property_change_callback("position")
    