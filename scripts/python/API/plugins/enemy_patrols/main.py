import asyncio
import sys
import math
import random
import re
import json
import tempfile
from pathlib import Path
from data.unit_spawn_table import UnitSpawnTable
from data.data_types import LatLng

from api import API
from plugin_base import Plugin

##Lets setup some basic globals
FIRST_RUN = None
STORED_ZONES = []

class RedPatrolUnit:
    def __init__(self, owner_plugin, unit_id, location, enemy_patrols_plugin_state="fight"):
        self.owner_plugin = owner_plugin
        self.unit_id = unit_id
        self.location = location
        self.enemy_patrols_plugin_state = enemy_patrols_plugin_state
        self.api: API | None = None
        self.logger = owner_plugin.logger


    def spawn_red_inf(self, api: API):
        # Implement the logic to spawn the unit using the API
        self.api = api
        units = [
                UnitSpawnTable(
                    unit_type="Infantry AK Ins",
                    location=self.location,
                    skill="Average",
                    livery_id="insurgent 8",
                    altitude=0,
                    heading=random.randint(0, 360),
                    )
                ]

        api.spawn_ground_units(
            units=units,
            coalition="neutral",
            country="",   # pick a valid neutral country in your mission
            immediate=True,
            spawnPoints=0,
            execution_callback=self.execution_callback,
        )
        self.logger.info(f"Spawning red patrol unit {self.unit_id} at location {self.location} with patrol state {self.enemy_patrols_plugin_state}")

    async def execution_callback(self, command_result):
        self.owner_plugin.register_pending_spawn_initialization(command_result, self.enemy_patrols_plugin_state)
        self.owner_plugin.try_initialize_pending_spawns()

class EnemyPatrols(Plugin):
    """
    EnemyPatrols plugin scafold
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        self.config = global_config.get("plugin_settings", {}).get(plugin_info.get("name"), {})
        self.red_spawn_threshold = int(self.config.get("red_spawn_threshold", -66))
        self.red_owned_threshold = int(self.config.get("red_owned_threshold", -33))
        self.min_group_size = int(self.config.get("min_group_size", 2))
        self.max_group_size = int(self.config.get("max_group_size", 4))
        self.min_town_groups_of_units = int(self.config.get("min_town_groups_of_units", 1))
        self.max_town_groups_of_units = int(self.config.get("max_town_groups_of_units", 3))
        self.suppression_trigger_level = float(self.config.get("suppression_trigger_level", 0.5))
        self.suppression_clear_level = float(self.config.get("suppression_clear_level", 0.25))
        self.pending_spawn_initializations = {}

        self.api: API | None = None  # Will be set when the plugin is started

    def on_start(self) -> bool:
        try:
            #Runtime persistance to stop lots of stuff spawning on plugin reloads, this is for things that we only want to do once per session, not on every plugin reload, e.g. when we are testing and reloading the plugin a lot, we dont want to spawn a load of units every time we reload the plugin, this is for things like that, it can be used for other things too but thats the main use case
            global FIRST_RUN
            runtime = self.global_config.setdefault('enemy_patrols_runtime', {})
            first_run_key = "enemy_patrols_plugin_first_run_done"

            if not runtime.get(first_run_key, False):
                self.logger.info("Performing first run setup for EnemyPatrols plugin.")
                runtime[first_run_key] = True
                FIRST_RUN = True  # This will trigger the first run setup in the on_update method     
            else:
                FIRST_RUN = False
                self.logger.info("EnemyPatrols plugin has already performed first run setup. Skipping to normal operation.")       
            
            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'),
            load_kokoro=False,
            load_whisper=False               
            )

            self.api.register_on_update_callback(self.on_update)

            self.api.run()

            self.logger.info("EnemyPatrols plugin started successfully.")
            return True
        except Exception as e:
            self.logger.error(f"Failed to start EnemyPatrols plugin: {e}", exc_info=True)
            return False
    
    def on_stop(self) -> bool:
        try:
            self.api.stop()
            self.api = None
            self.logger.info("EnemyPatrols plugin stopped successfully.")
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop EnemyPatrols plugin: {e}", exc_info=True)
            return False
        
    def on_pause(self) -> bool:
        try:
            self.logger.info("EnemyPatrols plugin paused successfully.")
            return True
        except Exception as e:
            self.logger.error(f"Failed to pause EnemyPatrols plugin: {e}", exc_info=True)   
            return False
        
    def on_resume(self) -> bool:
        try:
            self.logger.info("EnemyPatrols plugin resumed successfully.")
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume EnemyPatrols plugin: {e}", exc_info=True)
            return False
        
    def on_update(self, api:API):
        global FIRST_RUN
        if FIRST_RUN is None:
            self.watchdog_tick()
            return
        elif FIRST_RUN:
            zones, spawn_zones, town_centres, jungle_zones, centre_zones = self.get_all_zones()
            if zones is None:
                self.logger.info("No zones found, nothing to execute.")
                return
            
            #match up the spawn zones with the corresponding town centre zone and join them
            if self.link_spawn_zones_to_town_centres(spawn_zones, town_centres):
                self.logger.info("Successfully linked spawn zones to town centres.")
            else:
                self.logger.warning("Failed to link some spawn zones to town centres.")
               
            
            if town_centres: #spawns a load of flags, this will later depend on the red blueness score
                #initially pick a red / blueness score at random
                for town_centre in town_centres:
                    red_blueness_score = random.randint(-100, 100)  # This gives a value between -100 and 100
                    town_centre["red_blueness_score"] = red_blueness_score
                    self.logger.info(f"Assigned red_blueness_score of {red_blueness_score} to town centre {town_centre.get('name', '')}")
                # for town_centre in town_centres: #code to spawn random flags
                #     if town_centre.get("red_blueness_score", 0) < self.red_owned_threshold: #if the score is negative then we spawn a red flag
                #         self.spawn_static_at_zone(town_centre,"flag", "red", "neutral")
                #     else:
                #         self.spawn_static_at_zone(town_centre,"flag", "white", "neutral")   
                for town_centre in town_centres:
                    if town_centre.get("red_blueness_score", 0) < self.red_spawn_threshold: #this area is really bad, it can be a red generator of troops
                        print(town_centre.get("location",{}))
                        nearest_centre_zone = self.get_nearest_zone(town_centre.get("location", {}), centre_zones)
                        centre_zone_radius = nearest_centre_zone.get("radius", 0)
                        centre_zone_pos = LatLng(
                            nearest_centre_zone["location"]["lat"],
                            nearest_centre_zone["location"]["lng"],
                            nearest_centre_zone["location"].get("alt", 0),
                        )
                        
                        total_town_groups_of_units = random.randint(self.min_town_groups_of_units,self.max_town_groups_of_units) #this will later depend on the red blueness score and other factors, this is just a random number for now
                        if nearest_centre_zone:
                            tc = LatLng(
                                town_centre["location"]["lat"],
                                town_centre["location"]["lng"],
                                town_centre["location"].get("alt", 0),
                            )
                            enemy_patrols_plugin_state = random.choices(["fight", "ambush", "patrol", "hide", "retreat"],weights=[0.3, 0.2, 0.2, 0.2, 0.1], k=1)[0] #we randomise the state a bit so we get a mix of different states in the units that spawn, this is just for testing and can be changed later to be based on the red blueness score and other factors, e.g. if the score is really bad then we have more fight and less hide etc, this is just a random choice for now
                            #enemy_patrols_plugin_state = "patrol"#random.choice(["fight", "ambush", "patrol", "hide", "retreat"]) #used for testing specifics or even weights
                            for i in range(total_town_groups_of_units):
                                project_new_position_from_centre = centre_zone_pos.project_with_bearing_and_distance(centre_zone_radius, random.randint(0, 360))
                                cz = project_new_position_from_centre
                                bearing = tc.bearing_to(cz)
                                distance_m = tc.distance_to(cz)*random.random() #we randomise the distance a bit 
                                #if the distance is inside the actual spawn zone this is too close, we want them in the jungle
                                if distance_m < town_centre.get("radius", 0):
                                    distance_m = town_centre.get("radius", 0) + distance_m
                                position_to_spawn = tc.project_with_bearing_and_distance(distance_m / 2, bearing)
                                #we need to group the spawned units together based on the town centre they are linked to, this is because we want them to act as a group and have the same enemy_patrols_plugin_state, e.g. if one unit in the group goes into fight mode then they all go into fight mode, if one unit in the group goes into patrol mode then they all go into patrol mode etc, this is because we want them to act as a cohesive unit rather than individual units that do their own thing, this also makes it easier to manage the enemy_patrols_plugin_states of the units and make them more effective as a group rather than individual units that do their own thing
                                #work out how many to spawn based on the max spawn numer
                                size_of_group = random.randint(self.min_group_size, self.max_group_size)
                                # position_to_spawn = tc.project_with_bearing_and_distance(distance_m / 2, bearing) #we need to reset the spawn position for each group so they dont all spawn on top of each other
                                for j in range(size_of_group): #this will later depend on the red blueness score and other factors, this is just a random number for now
                                    position_to_spawn = position_to_spawn.project_with_bearing_and_distance(random.randint(3, 10), random.randint(0, 360)) #we randomise the spawn position a bit so they dont all spawn on top of each other
                                    red_patrol_unit = RedPatrolUnit(self, unit_id=f"red_patrol_{town_centre['name']}_{i}_{j}", location=position_to_spawn,enemy_patrols_plugin_state= enemy_patrols_plugin_state)
                                    red_patrol_unit.spawn_red_inf(self.api)

            FIRST_RUN = False
            self.watchdog_tick()
            return
        
        zones, spawn_zones, town_centres, jungle_zones, centre_zones = self.get_all_zones()
        if zones is None: #no point wasting CPU cycles if no zones in mission do nothing
            self.logger.info("No zones found, nothing to execute.")
            return
        
        #Lets get all the red units and work out what we do with them based on zone and enemy_patrols_plugin_state
        units = self.api.get_units()
        self._apply_pending_spawn_initializations(units)
        current_time = asyncio.get_event_loop().time()
        for unit in units:
            unit_object = units[unit]
            if hasattr(unit_object, 'enemy_patrols_plugin_state'):
                self._handle_unit_state(unit_object, town_centres, current_time)

        self.watchdog_tick()

    def register_pending_spawn_initialization(self, command_result, state_name):
        for result_id in self._normalize_spawn_result_ids(command_result):
            self.pending_spawn_initializations[result_id] = state_name

    def try_initialize_pending_spawns(self):
        if not self.api:
            return
        self._apply_pending_spawn_initializations(self.api.get_units())

    def _apply_pending_spawn_initializations(self, units):
        if not self.pending_spawn_initializations:
            return

        resolved_ids = []
        for result_id, state_name in self.pending_spawn_initializations.items():
            for unit_object in units.values():
                if self._unit_matches_spawn_result(unit_object, result_id):
                    self._initialize_patrol_unit(unit_object, state_name)
                    resolved_ids.append(result_id)
                    break

        for result_id in resolved_ids:
            del self.pending_spawn_initializations[result_id]

    def _normalize_spawn_result_ids(self, command_result):
        if isinstance(command_result, list):
            result_ids = []
            for value in command_result:
                result_id = self._coerce_result_id(value)
                if result_id is not None:
                    result_ids.append(result_id)
            return result_ids

        result_id = self._coerce_result_id(command_result)
        return [result_id] if result_id is not None else []

    def _coerce_result_id(self, value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    def _unit_matches_spawn_result(self, unit_object, result_id):
        return getattr(unit_object, 'unit_id', None) == result_id or getattr(unit_object, 'ID', None) == result_id

    def _initialize_patrol_unit(self, unit_object, state_name):
        unit_object.set_operate_as(1)
        unit_object.operate_as = "red"
        unit_object.enemy_patrols_plugin_state = state_name
        if not hasattr(unit_object, 'enemy_patrols_plugin_executing_a_task'):
            unit_object.enemy_patrols_plugin_executing_a_task = False

    def _handle_unit_state(self, unit_object, town_centres, current_time):
        has_active_flag = hasattr(unit_object, 'enemy_patrols_plugin_executing_a_task')
        is_active = getattr(unit_object, 'enemy_patrols_plugin_executing_a_task', False)
        suppression_level = getattr(unit_object, 'suppression_level', 0)
        previous_suppression_level = getattr(unit_object, 'enemy_patrols_plugin_previous_suppression_level', 0)
        trigger_level, clear_level = self._get_effective_suppression_thresholds(unit_object)

        if suppression_level <= clear_level:
            unit_object.enemy_patrols_plugin_suppression_latched = False

        if self._handle_suppression_override(unit_object, current_time, suppression_level, previous_suppression_level, trigger_level):
            unit_object.enemy_patrols_plugin_previous_suppression_level = suppression_level
            return

        if not has_active_flag:
            self._handle_initial_state(unit_object, town_centres)
        elif is_active:
            self._handle_active_state(unit_object, current_time)
        else:
            self._handle_inactive_state(unit_object, town_centres)

        unit_object.enemy_patrols_plugin_previous_suppression_level = suppression_level

    def _handle_suppression_override(self, unit_object, current_time, suppression_level, previous_suppression_level, trigger_level):
        if suppression_level <= trigger_level:
            return False
        if previous_suppression_level > trigger_level:
            return False
        if getattr(unit_object, 'enemy_patrols_plugin_suppression_latched', False):
            return False
        if unit_object.enemy_patrols_plugin_state == "suppressed_return_fire":
            return False

        unit_object.enemy_patrols_plugin_previous_state = unit_object.enemy_patrols_plugin_state
        previous_shots_scatter = getattr(unit_object, 'shots_scatter', 2)
        if not isinstance(previous_shots_scatter, int):
            previous_shots_scatter = 2
        unit_object.enemy_patrols_plugin_previous_shots_scatter = previous_shots_scatter
        previous_shots_intensity = getattr(unit_object, 'shots_intensity', 2)
        if previous_shots_intensity not in (1, 2, 3):
            previous_shots_intensity = 2
        unit_object.enemy_patrols_plugin_previous_shots_intensity = previous_shots_intensity
        unit_object.enemy_patrols_plugin_state = "suppressed_return_fire"
        unit_object.enemy_patrols_plugin_executing_a_task = True
        unit_object.enemy_patrols_plugin_suppression_latched = True
        unit_object.enemy_patrols_plugin_suppression_end_time = current_time + 30
        try:
            unit_object.unregister_on_destination_reached_callback()
        except Exception:
            pass
        try:
            unit_object.set_speed(0)
        except Exception:
            pass
        unit_object.miss_on_purpose("red")
        unit_object.shots_scatter = 3
        unit_object.set_shots_scatter(3)
        suppression_shots_intensity = random.randint(2, 3)
        unit_object.shots_intensity = suppression_shots_intensity
        unit_object.set_shots_intensity(suppression_shots_intensity)
        self.logger.info(f"Unit {unit_object.unit_id} is suppressed and returning fire with miss on purpose for 30 seconds.")
        return True

    def _get_effective_suppression_thresholds(self, unit_object):
        suppression_level = getattr(unit_object, 'suppression_level', 0)
        trigger_level = float(getattr(self, 'suppression_trigger_level', 0.5))
        clear_level = float(getattr(self, 'suppression_clear_level', 0.25))

        if suppression_level <= 1.0 and (trigger_level > 1.0 or clear_level > 1.0):
            trigger_level = trigger_level / 100.0
            clear_level = clear_level / 100.0

        return trigger_level, clear_level

    def _handle_initial_state(self, unit_object, town_centres):
        enemy_nearby = self.get_nearest_opposite_coalition_unit(unit_object, 5000)
        if enemy_nearby is None or not enemy_nearby:
            return
        self._dispatch_state_handler(unit_object, town_centres, enemy_nearby)

    def _handle_active_state(self, unit_object, current_time):
        if unit_object.enemy_patrols_plugin_state == "suppressed_return_fire":
            suppression_end_time = getattr(unit_object, 'enemy_patrols_plugin_suppression_end_time', 0)
            if current_time >= suppression_end_time:
                unit_object.enemy_patrols_plugin_state = getattr(unit_object, 'enemy_patrols_plugin_previous_state', "ambush")
                unit_object.enemy_patrols_plugin_executing_a_task = False
                unit_object.enemy_patrols_plugin_suppression_end_time = None
                restore_shots_scatter = getattr(unit_object, 'enemy_patrols_plugin_previous_shots_scatter', 2)
                if not isinstance(restore_shots_scatter, int):
                    restore_shots_scatter = 2
                restore_shots_intensity = getattr(unit_object, 'enemy_patrols_plugin_previous_shots_intensity', 2)
                if restore_shots_intensity not in (1, 2, 3):
                    restore_shots_intensity = 2
                try:
                    unit_object.shots_scatter = restore_shots_scatter
                    unit_object.set_shots_scatter(restore_shots_scatter)
                    unit_object.shots_intensity = restore_shots_intensity
                    unit_object.set_shots_intensity(restore_shots_intensity)
                except Exception:
                    pass
                unit_object.enemy_patrols_plugin_previous_shots_scatter = None
                unit_object.enemy_patrols_plugin_previous_shots_intensity = None
                self.logger.info(f"Unit {unit_object.unit_id} finished suppression return fire and reverted to state {unit_object.enemy_patrols_plugin_state}.")

    def _handle_inactive_state(self, unit_object, town_centres):
        state_name = unit_object.enemy_patrols_plugin_state

        if state_name == "patrol":
            self._handle_patrol_state(unit_object, town_centres, None)
            return

        enemy_nearby = self.get_nearest_opposite_coalition_unit(unit_object, 5000)
        if enemy_nearby is None or not enemy_nearby:
            return

        if state_name == "ambush":
            self._handle_ambush_state(unit_object, enemy_nearby)
        elif state_name == "fight":
            self._handle_fight_state(unit_object, enemy_nearby)
        elif state_name == "hide":
            self._handle_hide_state(unit_object, enemy_nearby)
        elif state_name == "retreat":
            self._handle_retreat_state(unit_object, enemy_nearby)

    def _dispatch_state_handler(self, unit_object, town_centres, enemy_nearby):
        state_name = unit_object.enemy_patrols_plugin_state
        if state_name == "fight":
            self._handle_fight_state(unit_object, enemy_nearby)
        elif state_name == "ambush":
            self._handle_ambush_state(unit_object, enemy_nearby)
        elif state_name == "patrol":
            self._handle_patrol_state(unit_object, town_centres, enemy_nearby)
        elif state_name == "hide":
            self._handle_hide_state(unit_object, enemy_nearby)
        elif state_name == "retreat":
            self._handle_retreat_state(unit_object, enemy_nearby)

    def _handle_fight_state(self, unit_object, enemy_nearby):
        air_or_ground = random.choices(["mop", "sim"], weights=[0.6, 0.4], k=1)[0]
        if air_or_ground == "mop":
            self._start_mop_engagement(unit_object, enemy_nearby, "fight")
        else:
            self._start_simulated_engagement(unit_object, enemy_nearby, "fight")

    def _handle_ambush_state(self, unit_object, enemy_nearby):
        self._start_simulated_engagement(unit_object, enemy_nearby, "ambush")

    def _handle_patrol_state(self, unit_object, town_centres, enemy_nearby):
        self.logger.info(f"Unit {unit_object.unit_id} is in patrol mode.")
        position = self._coerce_position_to_latlng(unit_object.position)
        nearest_zone = self.get_nearest_zone(position, town_centres)
        if not nearest_zone:
            if enemy_nearby is not None:
                self._handle_fight_state(unit_object, enemy_nearby)
                return
            return

        loc = nearest_zone.get("location", {})
        try:
            path_point = LatLng(
                float(loc.get("lat")),
                float(loc.get("lng", loc.get("lon"))),
                float(loc.get("alt", 0)),
            )
            path_point = path_point.project_with_bearing_and_distance(random.randint(5, 20), random.randint(0, 360))
            unit_object.set_path([path_point])
            zone_name = nearest_zone.get('name', '')
            try:
                unit_object.register_on_destination_reached_callback(
                    lambda the_unit, reached: self._on_patrol_destination_reached(the_unit, reached, zone_name),
                    path_point,
                    threshold=10,
                )
            except Exception:
                self.logger.warning(f"Failed to register destination callback for unit {unit_object.unit_id}")
        except (TypeError, KeyError, ValueError):
            self.logger.warning(f"Invalid nearest_zone location for {nearest_zone.get('name','')}, skipping set_path.")
            return

        unit_object.set_speed(2)
        unit_object.enemy_patrols_plugin_executing_a_task = True
        self.logger.info(f"Unit {unit_object.unit_id} is moving towards zone {nearest_zone.get('name', '')} in patrol mode.")

    def _handle_hide_state(self, unit_object, enemy_nearby):
        unit_object.enemy_patrols_plugin_executing_a_task = True
        self.logger.info(f"Unit {unit_object.unit_id} is hiding and will not engage nearby enemy {enemy_nearby.unit_id} unless certain conditions are met.")

    def _handle_retreat_state(self, unit_object, enemy_nearby):
        unit_object.simulate_engagement()
        unit_object.enemy_patrols_plugin_executing_a_task = True
        unit_object.set_shots_scatter(2)
        unit_object.set_shots_intensity(3)

    def _on_patrol_destination_reached(self, unit_object, reached, zone_name):
        if reached:
            unit_object.enemy_patrols_plugin_state = "ambush"
            unit_object.enemy_patrols_plugin_executing_a_task = False
            try:
                unit_object.set_speed(0)
            except Exception:
                pass
            self.logger.info(f"Unit {unit_object.unit_id} reached {zone_name} and is now in ambush mode.")

    def _coerce_position_to_latlng(self, position):
        try:
            if isinstance(position, LatLng):
                return position
            return LatLng(
                float(position.get("lat")),
                float(position.get("lng", position.get("lon"))),
                float(position.get("alt", 0)),
            )
        except Exception:
            return position

    def _start_mop_engagement(self, unit_object, enemy_nearby, state_name):
        unit_object.miss_on_purpose("red")
        unit_object.enemy_patrols_plugin_executing_a_task = True
        unit_object.set_shots_scatter(3)
        unit_object.set_shots_intensity(random.randint(2, 3))
        self.logger.info(f"Unit {unit_object.unit_id} is engaging in {state_name} mode with miss on purpose (MOP) against nearby enemy {enemy_nearby.unit_id}.")

    def _start_simulated_engagement(self, unit_object, enemy_nearby, state_name):
        unit_object.simulate_engagement()
        unit_object.enemy_patrols_plugin_executing_a_task = True
        unit_object.set_shots_scatter(random.randint(2, 3))
        unit_object.set_shots_intensity(random.randint(1, 3))
        self.logger.info(f"Unit {unit_object.unit_id} is engaging in {state_name} mode with simulated engagement (SIM) against nearby enemy {enemy_nearby.unit_id}.")

    def get_nearest_opposite_coalition_unit(self, unit_object, max_distance=10000):
        #print(unit_object.operate_as, unit_object.coalition)
        if unit_object.operate_as == "blue" or unit_object.coalition == "blue":
            #print("Unit is blue")
            enemy_coalition = "red"
        elif unit_object.operate_as == "red" or unit_object.coalition == "red":
            #print("Unit is red")
            enemy_coalition = "blue"
        else:
            return None
        #print(f"Didn't expected to see this {enemy_coalition}")
        closest_units = self.api.get_closest_units(
            coalitions=[enemy_coalition],
            categories=["ground", "aircraft", "helicopter"],
            position=unit_object.position,
            operate_as = unit_object.operate_as,
            max_number=1,
            max_distance=max_distance,
        )
        return closest_units[0] if closest_units else None

    def get_all_zones(self):
        try:
            mission = self.api.update_mission()
            mission_triggers = mission.get("triggers", {})
            #make an array of the zones for blue and then red
            zones = []
            spawn_zones = []
            town_centres = []
            jungle_zones = []
            centre_zones = []
            for trigger in mission_triggers:
               zone_name = mission_triggers[trigger].get("name", "")
               if re.match(r"^[tT][cC]-.+-\d+$", zone_name):
                   town_centres.append(mission_triggers[trigger]) # adds the zone to the town centres list
               elif re.match(r"^[sS][vV]-.+-\d+$", zone_name) or re.match(r"^[lL][vV]-.+-\d+$", zone_name) or re.match(r"^[sS][hH]-.+-\d+$", zone_name):
                   spawn_zones.append(mission_triggers[trigger]) # adds the zone to the spawn zones list
               elif re.match(r"^[jJ][zZ]-.+-\d+$", zone_name):
                   jungle_zones.append(mission_triggers[trigger]) # adds the zone to the jungle zones list
               elif re.match(r"^[iI][mM]-\d+$",zone_name):
                   centre_zones.append(mission_triggers[trigger]) # adds the zone to the centre zones list

            zones = spawn_zones + town_centres + jungle_zones + centre_zones

        except Exception as e:
            self.logger.error(f"Error in get_all_zones: {e}", exc_info=True)
            return None
        
        return zones, spawn_zones, town_centres, jungle_zones, centre_zones
    
    def link_spawn_zones_to_town_centres(self, spawn_zones, town_centres):
        try:
            for spawn_zone in spawn_zones:
                spawn_zone_name = spawn_zone.get("name", "").lower()
                spawn_zone_name = re.match(r"^[sSlL][vVhH]-(.+)-\d+$", spawn_zone_name)
                if spawn_zone_name is not None:
                    spawn_zone_name = spawn_zone_name.group(1)
                    for town_centre in town_centres:
                        town_centre_name = town_centre.get("name", "").lower()
                        town_centre_name = re.match(r"^[tT][cC]-(.+)-\d+$", town_centre_name)
                        if town_centre_name is not None:
                            town_centre_name = town_centre_name.group(1)
                            if spawn_zone_name == town_centre_name:
                                spawn_zone["linked_town_centre_name"] = town_centre.get("name", "")
                                town_centre["linked_spawn_zone_name"] = spawn_zone.get("name", "")
            return True

        except Exception as e:
            self.logger.error(f"Error in link_spawn_zones_to_town_centres: {e}", exc_info=True)
            return False

    def get_nearest_zone(self, zone_location, zones):
        try:
            zone_lat, zone_lng = self._extract_lat_lng(zone_location)
            if zone_lat is None or zone_lng is None:
                self.logger.warning(f"Invalid location for zone")
                return None
            
            nearest_zone = None
            nearest_distance = float('inf')

            for candidate_zone in zones:
                candidate_location = candidate_zone.get("location", {})
                candidate_lat, candidate_lng = self._extract_lat_lng(candidate_location)
                if candidate_lat is None or candidate_lng is None:
                    self.logger.warning(f"Invalid location for zone '{candidate_zone.get('name', '')}': {candidate_location}")
                    continue

                distance = math.sqrt((zone_lat - candidate_lat) ** 2 + (zone_lng - candidate_lng) ** 2)
                if distance < nearest_distance:
                    nearest_distance = distance
                    nearest_zone = candidate_zone

            return nearest_zone
        except Exception as e:
            self.logger.error(f"Error in get_nearest_zone: {e}", exc_info=True)
            return None
        

    def _extract_lat_lng(self, point):
        # Accept either a dict-like payload with 'lat' and 'lng'/'lon',
        # or a `LatLng`-like object with `lat` and `lng` attributes.
        try:
            # LatLng dataclass or other objects with lat/lng attributes
            if hasattr(point, "lat") and hasattr(point, "lng"):
                return float(point.lat), float(point.lng)

            # Dict-like payload
            if isinstance(point, dict) and "lat" in point:
                lat = float(point.get("lat"))
                if "lng" in point:
                    lng = float(point.get("lng"))
                elif "lon" in point:
                    lng = float(point.get("lon"))
                else:
                    return None, None
                return lat, lng

        except (TypeError, ValueError, AttributeError):
            return None, None

        return None, None

    def get_neutral_countries(self):
        try:
            mission = self.api.update_mission()
            coalitions = mission.get("coalitions", {})
            neutral = coalitions.get("neutral", {})
            
            if not neutral:
                self.logger.warning("No neutral coalition found in the mission.")
                return []
            
            # If neutral is a dict, return its values (country data dicts)
            if isinstance(neutral, dict):
                countries = list(neutral.values())
                return countries if countries else []
            
            # If neutral is already a list, return it
            if isinstance(neutral, list):
                return neutral
            
            return []
        except Exception as e:
            self.logger.error(f"Error getting neutral countries: {e}", exc_info=True)
            return []

    def spawn_static_at_zone(self, zone, type="flag", colour="white", coalition="neutral"):
        if not zone:
            self.logger.info("No zone available for static spawning.")
            return
        
        if coalition.lower() == "neutral":
                neutral_countries = self.get_neutral_countries()
                a_neutral_country_name_string = neutral_countries[0]
        else:
            return
        
        if type == "flag":
            if colour.lower() == "white":
                static_type = "White_Flag"
            elif colour.lower() == "red":
                static_type = "Red_Flag"
            else:
                return
        else:
            return

        #get a neutral coalition country, this is used to spawn the statics in, we want them to be neutral so they dont get removed by the game when a coalition gets removed, e.g. if we spawn them as russian and then the russians get removed from the mission for whatever reason then the statics will also get removed, but if we spawn them as a neutral country then they will stay in the mission regardless of what happens to the coalitions
        static_category = self.config.get("static_category", "Fortifications")
        static_country = self.config.get("static_country", "country.id." + a_neutral_country_name_string)

        zone_name = str(zone.get("name", "zone"))
        location = zone.get("location", {})
        lat, lng = self._extract_lat_lng(location)

        if lat is None or lng is None:
            self.logger.warning(f"Skipping zone '{zone_name}' due to invalid location payload: {location}")
            return

        safe_zone_name = re.sub(r"[^A-Za-z0-9_-]", "_", zone_name)
        static_name = f"EP_STATIC_{safe_zone_name}"

        lua_lines = [
            f"do",
            f"  local ll = coord.LLtoLO({lat}, {lng})",
            f"  local ok = coalition.addStaticObject({static_country}, {{",
            f"    name = {json.dumps(static_name)},",
            f"    type = {json.dumps(static_type)},",
            f"    category = {json.dumps(static_category)},",
            f"    x = ll.x,",
            f"    y = ll.z,",
            f"    heading = 0,",
            f"    canCargo = false",
            f"  }})",
            f"  env.info(string.format('EnemyPatrols static spawn zone={json.dumps(zone_name)} colour={json.dumps(colour)} success=%s', tostring(ok)))",
            f"end",
        ]

        lua_script = "\n".join(lua_lines)

        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix="_enemy_patrols_spawn_static.lua", delete=False, encoding="utf-8") as lua_file:
                lua_file.write(lua_script)
                lua_path = Path(lua_file.name)

            self.api.execute_file(str(lua_path))
            self.logger.info(f"Submitted static spawn Lua for zone '{zone_name}' with colour '{colour}': {lua_path}")
        except Exception as e:
            self.logger.error(f"Error spawning static at zone '{zone_name}': {e}", exc_info=True)

"""
Plan of action

We first need to get the spawn trigger zones
Create spawnable groups of units near the trigger zones, towards an island centre point, they need to act similarily (with respect to how they engage air units)
These then need to do nothing unless a player is within a certain distance of them 

Spawning logic / problems
- Getting the trigger zones
- Collating the groups together into a bunch of units that act similarly
- Having a function that sways how likely it is to spawn something there, e.g. when we have the red / blueness score
- avoiding the ocean


When spawned they need different states, with the max setting for a group depending on that groups max
-This means we need a distance checking function to opposite coalition units
-This then sets randomly a only do something if 
        - FIGHT shoot into the air (MOP), engage any ground forces (SIM)
        - AMBUSH STATE a helicopter is on the ground, or when a helicopter is low alittude and slow e.g. landing, or if a ground unit is really close
        - FIGHT GROUND shoot at other ground units only (SIM), or if suppression percentage goes up e.g. return fire only (RFO)
        = PATROL they will move from the TC to a random point in the SV zone and back for a set time and then go back to the jungle
        - HIDE do nothing, unless certain states are met, in which case they will fire (SIM / MOP) for x seconds at max, and then retreat away from nearest threat and (RFO)
        - RETREAT this picks another friendly place on the island and moves there, when arrive reset state to IDLE
            - this needs to be a future proofed function that will take a future zones red / blue score


"""