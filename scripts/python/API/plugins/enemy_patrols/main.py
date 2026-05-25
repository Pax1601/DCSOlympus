import asyncio
import math
import random
import re
import json
import tempfile
from pathlib import Path
from data.unit_spawn_table import UnitSpawnTable
from data.data_types import LatLng

from api import API, Unit
from utils.utils import coalition_to_enum
from plugin_base import Plugin

class EnemyPatrolsUnit(Unit):
    patrol_state = "No state"
    
    def set_patrol_state(self, patrol_state):
        self.patrol_state = patrol_state
        
        self.set_operate_as(coalition_to_enum("red"))
        
        # If we are in fight more, we fight
        if patrol_state == "fight":
            if random.random() < 0.25:
                self.miss_on_purpose()
            else:
                self.simulate_engagement()
        
    def update(self, units: dict[int, Unit]):
        if self.patrol_state == "ambush":
            for unit in units.values():
                if unit.position.distance_to(self.position) < 200 and (unit.coalition == "blue" or unit.operate_as == "blue") and unit.airborne:
                    self.miss_on_purpose()
                    break
            
            # Stop the unit from miss on purpose if there is no target nearby
            if self.target_id == 0:
                self.set_path([self.position])
            
        elif self.patrol_state == "patrol":
            # If the unit is doing nothing, make them walk
            if self.state == "idle":
                self.set_path([self.position.project_with_bearing_and_distance(random.random() * 1000, random.random() * 2 * math.pi)])
                           
            # If someone is shooting at us, return fire
            if self.suppression_level > 0.5:
                if random.random() < 0.25:
                    self.miss_on_purpose()
                else:
                    self.simulate_engagement()
        
            
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
        self.max_units = int(self.config.get("max_units", 200))
        self.spawn_counter = 0
        self.pending_spawn_initializations = {}

        self.api: API | None = None  # Will be set when the plugin is started
        self.mission_started = False

    def on_start(self) -> bool:
        self.mission_started = False
        
        try:
            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'),
            load_kokoro=False,
            load_whisper=False,
            SRS_folder=self.global_config.get('SRS_folder', '.')              
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
            deleted_count = 0
            if self.api:
                for unit in self.api.get_units().values():
                    unit_name = unit.unit_name
                    if not isinstance(unit_name, str) or not unit_name.startswith("VC_TIAC_"):
                        continue
                    try:
                        unit.delete_unit(False, "", True)
                        deleted_count += 1
                    except Exception:
                        self.logger.warning(f"Failed to delete TIAC unit {unit_name}", exc_info=True)

            self.logger.info(f"Deleted {deleted_count} TIAC units during stop.")

            if self.api:
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
        self.api = api
        self.watchdog_tick()
        
        # Check if the mission has started
        if not self.mission_started:
            if self.check_mission_started():
                self.logger.info("Mission has started, initializing plugin")
                self.mission_started = True
                self.initialize()
            else:
                return  # Don't do anything
                
        zones, _, _, _, _ = self.get_all_zones()
        if zones is None: #no point wasting CPU cycles if no zones in mission do nothing
            self.logger.info("No zones found, nothing to execute.")
            return
        
        #Lets get all the red units and work out what we do with them based on zone and enemy_patrols_plugin_state
        units = self.api.get_units()
        self.apply_pending_spawn_initializations(units)
        
        # Run the update cycle on all units of the EnemyPatrolsUnit class
        for unit in units.values():
            if isinstance(unit, EnemyPatrolsUnit):
                unit.update(units)
       
    def initialize(self):
        zones, spawn_zones, town_centres, jungle_zones, centre_zones = self.get_all_zones()
        if zones is None:
            self.logger.info("No zones found, nothing to execute.")
            return
        
        #match up the spawn zones with the corresponding town centre zone and join them
        if self.link_spawn_zones_to_town_centres(spawn_zones, town_centres):
            self.logger.info("Successfully linked spawn zones to town centres.")
        else:
            self.logger.warning("Failed to link some spawn zones to town centres.")
            
        marker_counter = 0
        if town_centres: #spawns a load of flags, this will later depend on the red blueness score
            #initially pick a red / blueness score at random
            for town_centre in town_centres:
                red_blueness_score = random.randint(-100, 100)  # This gives a value between -100 and 100
                town_centre["red_blueness_score"] = red_blueness_score
                self.logger.info(f"Assigned red_blueness_score of {red_blueness_score} to town centre {town_centre.get('name', '')}")
                
                nearest_centre_zone = self.get_nearest_zone(town_centre.get("location", {}), centre_zones)
                if not nearest_centre_zone:
                    continue
                centre_zone_radius = nearest_centre_zone.get("radius", 0)
                centre_zone_pos = LatLng(
                    nearest_centre_zone["location"]["lat"],
                    nearest_centre_zone["location"]["lng"],
                    nearest_centre_zone["location"].get("alt", 0),
                )
                
                self.api.create_marker(7000 + marker_counter, centre_zone_pos, f"Blue/red score = {red_blueness_score}")
                marker_counter += 1
                
                if town_centre.get("red_blueness_score", 0) < self.red_spawn_threshold: #this area is really bad, it can be a red generator of troops
                    self.logger.info(f"Generating enemy patrol spawns near town centre {town_centre.get('name', '')}")
                    
                    total_town_groups_of_units = random.randint(self.min_town_groups_of_units,self.max_town_groups_of_units) #this will later depend on the red blueness score and other factors, this is just a random number for now
                    tc = LatLng(
                        town_centre["location"]["lat"],
                        town_centre["location"]["lng"],
                        town_centre["location"].get("alt", 0),
                    )
                    patrol_state = random.choices(["fight", "ambush", "patrol"],weights=[0.55, 0.35, 0.1], k=1)[0] #we randomise the state a bit so we get a mix of different states in the units that spawn
                    #enemy_patrols_plugin_state = "patrol"#random.choice(["fight", "ambush", "patrol"]) #used for testing specifics or even weights
                    for i in range(total_town_groups_of_units):
                        project_new_position_from_centre = centre_zone_pos.project_with_bearing_and_distance(centre_zone_radius, random.randint(0, 360))
                        cz = project_new_position_from_centre
                        bearing = tc.bearing_to(cz)
                        distance_m = town_centre.get("radius", 0) + distance_m
                        position_to_spawn = tc.project_with_bearing_and_distance(distance_m / 2, bearing)
                        #we need to group the spawned units together based on the town centre they are linked to, this is because we want them to act as a group and have the same enemy_patrols_plugin_state, e.g. if one unit in the group goes into fight mode then they all go into fight mode, if one unit in the group goes into patrol mode then they all go into patrol mode etc, this is because we want them to act as a cohesive unit rather than individual units that do their own thing, this also makes it easier to manage the enemy_patrols_plugin_states of the units and make them more effective as a group rather than individual units that do their own thing
                        #work out how many to spawn based on the max spawn numer
                        size_of_group = random.randint(self.min_group_size, self.max_group_size)
                        # position_to_spawn = tc.project_with_bearing_and_distance(distance_m / 2, bearing) #we need to reset the spawn position for each group so they dont all spawn on top of each other
                        for j in range(size_of_group): #this will later depend on the red blueness score and other factors, this is just a random number for now
                            position_to_spawn = position_to_spawn.project_with_bearing_and_distance(random.randint(3, 10), random.randint(0, 360)) #we randomise the spawn position a bit so they dont all spawn on top of each other
                            self.spawn_red_inf(position_to_spawn, patrol_state)
        
    def check_mission_started(self):
        result = self.api.update_mission()
        if not result or result['dateAndTime']['elapsedTime'] < 30:
            return False
        return True

    def spawn_red_inf(self, location, patrol_state):
        if not self.api:
            return

        units_by_id = self.api.update_units()
        for existing_unit_object in units_by_id.values():
            if existing_unit_object.unit_name == f"VC_TIAC_{self.spawn_counter}" and existing_unit_object.alive:
                location = existing_unit_object.position
                self.logger.info(f"Unit VC_TIAC_{self.spawn_counter} already exists, respawning at existing location {location}")
                break

        units = [
            UnitSpawnTable(
                name=f"VC_TIAC_{self.spawn_counter}",
                unit_type="Infantry AK Ins",
                location=location,
                skill="Average",
                livery_id="insurgent 8",
                altitude=0,
                heading=random.randint(0, 360),
            )
        ]

        if self.spawn_counter < self.max_units:
            self.api.spawn_ground_units(
                units = units,
                coalition = "neutral",
                country = "",   # pick a valid neutral country in your mission
                immediate = True,
                spawnPoints = 0,
                groupName = f"VC_TIAC_{self.spawn_counter}",
                execution_callback = lambda ID: self.spawn_execution_callback(ID, patrol_state),
            )
            self.logger.info(f"Spawning red patrol unit VC_TIAC_{self.spawn_counter} at location {location} with patrol state {patrol_state}")

        self.spawn_counter += 1

    async def spawn_execution_callback(self, ID, patrol_state):
        self.pending_spawn_initializations[ID] = patrol_state

    def apply_pending_spawn_initializations(self, units: dict[int, Unit]):
        if not self.pending_spawn_initializations:
            return

        resolved_ids = []
        for result_id, patrol_state in self.pending_spawn_initializations.items():
            for unit in units.values():
                if unit.ID == result_id:
                    unit.__class__ = EnemyPatrolsUnit
                    unit.set_patrol_state(patrol_state)
                    resolved_ids.append(result_id)
                    break

        for result_id in resolved_ids:
            del self.pending_spawn_initializations[result_id]
                        
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