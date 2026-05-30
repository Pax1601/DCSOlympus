import time
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
    original_position = None
    town_centre = LatLng(0, 0)
    idle_start_time = 0
    
    def set_patrol_state(self, patrol_state, town_centre):
        self.patrol_state = patrol_state
        self.town_centre = town_centre
        self.original_position = self.position
        
        self.set_operate_as(coalition_to_enum("red"))
        self.set_shots_intensity(3)
        self.set_shots_scatter(3)
        self.set_speed(2)
        self.idle_start_time = 0
        
        # If we are in fight mode, we fight.
        if patrol_state == "fight":
            if random.random() < 0.25:
                self.miss_on_purpose()
                return 1
            else:
                self.simulate_engagement()
                return 1
        return 1
        
    def update(self, units: dict[int, Unit]):        
        if self.patrol_state == "ambush":
            if self.state == "idle":
                for unit in units.values():
                    # Spring the trap when enemy unit lands nearby or enemy infantry are nearby
                    if unit.position.distance_to(self.position) < 200 and (unit.coalition == "blue" or unit.operate_as == "blue") and not unit.airborne and unit.alive:
                        if unit.category == "GroundUnit":
                            self.simulate_engagement()
                        else:
                            self.miss_on_purpose()
                        return 1
            else:
                # Stop the unit from shooting if there is no enemy nearby
                unit_found = False
                for unit in units.values():
                    if unit.position.distance_to(self.position) < 200 and (unit.coalition == "blue" or unit.operate_as == "blue") and unit.alive:
                        unit_found = True
                        break
                    
                if not unit_found:
                    self.set_path([])
                    return 1
            
        elif self.patrol_state == "patrol":
            # If the unit is doing nothing, make them walk
            if self.state == "idle":
                # Check if we have reached the village
                if (self.town_centre.distance_to(self.position) < 50):
                    if self.idle_start_time == 0:
                        self.idle_start_time = time.time()
                    
                    # Check if the unit has been in the village for 10 minutes
                    if time.time() - self.idle_start_time > 60 * 10:
                        self.set_path([self.original_position])
                        self.idle_start_time = 0
                        return 1
                    else:
                        return 0
                else:
                    self.set_path([self.town_centre])
                    self.idle_start_time = 0
                    return 1

            # If we are walking, check if someone is being a bully.
            elif self.state == "reach-destination":
                # If someone is shooting at us, return fire
                if self.suppression_level > 0.5:
                    self.miss_on_purpose()
                    return 1
                
                # If there are enemy units nearby, get in simulated engagement
                for unit in units.values():
                    if unit.position.distance_to(self.position) < 200 and (unit.coalition == "blue" or unit.operate_as == "blue") and unit.category == "GroundUnit" and unit.alive:
                        self.simulate_engagement()
                        return 1
            else:
                # Stop the unit from shooting if there is no enemy nearby
                unit_found = False
                for unit in units.values():
                    if unit.position.distance_to(self.position) < 200 and (unit.coalition == "blue" or unit.operate_as == "blue") and unit.alive:
                        unit_found = True
                        break

                if not unit_found:
                    self.set_path([])
                    return 1
        return 0
    
            
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
        
    def on_update(self, api: API):
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
                
        zones, _, town_centres, _, _ = self.get_all_zones()
        if zones is None:  # No point wasting CPU cycles if no zones are in mission.
            self.logger.info("No zones found, nothing to execute.")
            return
        
        # Let's get all the red units and work out what we do with them.
        units = self.api.get_units()
        self.apply_pending_spawn_initializations(units)
        
        # Run the update cycle on all units of the EnemyPatrolsUnit class
        mission = self.api.get_mission()
        iteration_load = 0
        if mission.get('load', 100) < 100:
            for unit in units.values():
                if isinstance(unit, EnemyPatrolsUnit):
                    iteration_load += unit.update(units)
                    if iteration_load > 25:
                        break
       
    def initialize(self):
        zones, spawn_zones, town_centres, jungle_zones, centre_zones = self.get_all_zones()
        if zones is None:
            self.logger.info("No zones found, nothing to execute.")
            return
        
        # Match up the spawn zones with the corresponding town centre zone and join them.
        if self.link_spawn_zones_to_town_centres(spawn_zones, town_centres):
            self.logger.info("Successfully linked spawn zones to town centres.")
        else:
            self.logger.warning("Failed to link some spawn zones to town centres.")

        # Check if a folder name "scores" exists, if not create it
        if not Path("scores").exists():
            try:
                Path("scores").mkdir()
                self.logger.info("Created 'scores' folder for storing red blueness scores.")
            except Exception as e:
                self.logger.error(f"Failed to create 'scores' folder: {e}", exc_info=True)

        # Check if a file name "scores/red_blueness_scores.json" exists, if not create it with an empty json object
        scores_file_path = Path("scores/red_blueness_scores.json")
        if not scores_file_path.exists():
            try:
                with open(scores_file_path, "w") as f:
                    json.dump({}, f)
                self.logger.info("Created 'scores/red_blueness_scores.json' file for storing red blueness scores.")
            except Exception as e:
                self.logger.error(f"Failed to create 'scores/red_blueness_scores.json' file: {e}", exc_info=True)

        # Read the existing red blueness scores from the file
        try:
            with open(scores_file_path, "r") as f:
                red_blueness_scores = json.load(f)
            self.logger.info("Loaded existing red blueness scores from file.")
        except Exception as e:
            self.logger.error(f"Failed to load 'scores/red_blueness_scores.json' file: {e}", exc_info=True)
            
        if town_centres:  # Spawns a load of flags based on red blueness score.
            # Initially pick a red blueness score at random.
            for town_centre in town_centres:
                self.watchdog_tick()  # Keep the dog happy.

                # Check if we already have a red blueness score for this town centre, if so use it, if not generate a new one and save it to the file
                if red_blueness_scores and town_centre.get("name", "") in red_blueness_scores:
                    red_blueness_score = red_blueness_scores[town_centre.get("name", "")]
                    self.logger.info(f"Loaded existing red_blueness_score of {red_blueness_score} for town centre {town_centre.get('name', '')} from file")
                else:
                    red_blueness_score = random.randint(-100, 100)  # This gives a value between -100 and 100
                    red_blueness_scores[town_centre.get("name", "")] = red_blueness_score
                    
                    # Save the updated scores back to the file
                    try:
                        with open(scores_file_path, "w") as f:
                            json.dump(red_blueness_scores, f)
                        self.logger.info(f"Saved new red_blueness_score of {red_blueness_score} for town centre {town_centre.get('name', '')} to file")
                    except Exception as e:
                        self.logger.error(f"Failed to save 'scores/red_blueness_scores.json' file: {e}", exc_info=True)

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

                tc = LatLng(
                    town_centre["location"]["lat"],
                    town_centre["location"]["lng"],
                    town_centre["location"].get("alt", 0),
                )
                                
                if town_centre.get("red_blueness_score", 0) < self.red_spawn_threshold:  # This area is unstable and can generate red troops.
                    self.logger.info(f"Generating enemy patrol spawns near town centre {town_centre.get('name', '')}")
                    
                    total_town_groups_of_units = random.randint(self.min_town_groups_of_units, self.max_town_groups_of_units)  # This is currently a random placeholder.
                   
                    patrol_state = random.choices(["fight", "ambush", "patrol"], weights=[0.55, 0.35, 0.1], k=1)[0]  # Randomize state to get a mix of spawned unit behaviors.
                    
                    # Enemy patrols plugin state = "patrol"  # Used for testing specifics or custom weights.
                    for i in range(total_town_groups_of_units):
                        position_to_spawn = LatLng(
                            town_centre["location"]["lat"],
                            town_centre["location"]["lng"],
                            town_centre["location"].get("alt", 0),
                        )
                        # Find the nearest jungle zone and spawn the units there. Otherwise revert to random spawning within a certain radius of the town centre.
                        if jungle_zones:
                            nearest_jungle_zone = self.get_nearest_zone(town_centre.get("location", {}), jungle_zones)
                            if nearest_jungle_zone:
                                nearest_jungle_zone_pos = LatLng(
                                    nearest_jungle_zone["location"]["lat"],
                                    nearest_jungle_zone["location"]["lng"],
                                    nearest_jungle_zone["location"].get("alt", 0),
                                )
                                position_to_spawn = nearest_jungle_zone_pos.project_with_bearing_and_distance(random.randint(10, 30), random.randint(0, 360))  # Randomize spawn position to avoid overlap.
                        else:
                            project_new_position_from_centre = centre_zone_pos.project_with_bearing_and_distance(centre_zone_radius, random.randint(0, 360))
                            cz = project_new_position_from_centre
                            bearing = tc.bearing_to(cz)
                            distance_m = tc.distance_to(cz) * random.random()  # Randomize the distance a bit.
                            
                            # If the distance is inside the actual spawn zone this is too close; we want them in the jungle.
                            if distance_m < town_centre.get("radius", 0):
                                distance_m = town_centre.get("radius", 0) + distance_m
                            position_to_spawn = tc.project_with_bearing_and_distance(distance_m / 2, bearing)
                        
                        # Group spawned units by town centre so they behave as a cohesive patrol.
                        # Work out how many to spawn based on group-size limits.
                        size_of_group = random.randint(self.min_group_size, self.max_group_size)
                        
                        # Position to spawn = tc.project_with_bearing_and_distance(distance_m / 2, bearing)  # Reset spawn position per group if needed.
                        for j in range(size_of_group):  # This is currently a random placeholder.
                            position_to_spawn = position_to_spawn.project_with_bearing_and_distance(random.randint(3, 10), random.randint(0, 360))  # Randomize the spawn position to avoid overlap.
                            
                            town_centre_lat_lng = LatLng(
                                town_centre["location"]["lat"],
                                town_centre["location"]["lng"],
                                town_centre["location"].get("alt", 0),
                            )
                            self.spawn_red_inf(position_to_spawn, patrol_state, town_centre_lat_lng)
                            
        # Spawn a couple of trucks at each jungle zone and make them go towards the nearest jungle zone
        if jungle_zones:
            for jungle_zone in jungle_zones:
                self.watchdog_tick()  # Keep the dog happy.

                nearest_jungle_zone = self.get_nearest_zone(jungle_zone.get("location", {}), jungle_zones)
                if not nearest_jungle_zone:
                    continue
                nearest_jungle_zone_pos = LatLng(
                    nearest_jungle_zone["location"]["lat"],
                    nearest_jungle_zone["location"]["lng"],
                    nearest_jungle_zone["location"].get("alt", 0),
                )

                for i in range(random.randint(1, 3)):  # Spawn 1 to 3 trucks in each jungle zone.
                    spawn_position = LatLng(
                        jungle_zone["location"]["lat"],
                        jungle_zone["location"]["lng"],
                        jungle_zone["location"].get("alt", 0),
                    ).project_with_bearing_and_distance(random.randint(10, 30), random.randint(0, 360))  # Randomize spawn position to avoid overlap.
                    self.spawn_red_truck(spawn_position, nearest_jungle_zone_pos)  # For now we make them patrol.
                    
        # Spawn a couple of trucks at each village centre and make them go towards the nearest village centre
        if town_centres:
            for town_centre in town_centres:
                self.watchdog_tick()  # Keep the dog happy.

                nearest_town_centre = self.get_nearest_zone(town_centre.get("location", {}), town_centres)
                if not nearest_town_centre:
                    continue
                nearest_town_centre_pos = LatLng(
                    nearest_town_centre["location"]["lat"],
                    nearest_town_centre["location"]["lng"],
                    nearest_town_centre["location"].get("alt", 0),
                )

                for i in range(random.randint(1, 3)):  # Spawn 1 to 3 trucks in each village centre.
                    spawn_position = LatLng(
                        town_centre["location"]["lat"],
                        town_centre["location"]["lng"],
                        town_centre["location"].get("alt", 0),
                    ).project_with_bearing_and_distance(random.randint(10, 30), random.randint(0, 360))  # Randomize spawn position to avoid overlap.
                    self.spawn_red_truck(spawn_position, nearest_town_centre_pos)  # For now we make them patrol.
                    
        # Add a couple of static tents in the jungle zones for flavour
        if jungle_zones:
            for jungle_zone in jungle_zones:
                self.watchdog_tick()  # Keep the dog happy.
                self.api.spawn_static_object(
                    canCargo=False,
                    coalition="neutral",
                    dead=False,
                    heading=random.randint(0, 360),
                    linkOffset=False,
                    location=LatLng(
                        jungle_zone["location"]["lat"],
                        jungle_zone["location"]["lng"],
                        jungle_zone["location"].get("alt", 0),
                    ).project_with_bearing_and_distance(random.randint(10, 30), random.randint(0, 360)),  # Randomize spawn position to avoid overlap.
                    mass=100,
                    shapeName="FARP Tent",
                    type="FARP Tent"
                )
        
    def check_mission_started(self):
        result = self.api.update_mission()
        if not result or result['dateAndTime']['elapsedTime'] < 30:
            return False
        return True

    def spawn_red_inf(self, location, patrol_state, town_centre):
        if not self.api:
            return

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
                units=units,
                coalition="neutral",
                country="",  # Pick a valid neutral country in your mission.
                immediate=True,
                spawnPoints=0,
                groupName=f"VC_TIAC_{self.spawn_counter}",
                execution_callback=lambda ID: self.spawn_execution_callback(ID, patrol_state, town_centre),
            )
            self.logger.info(f"Spawning red patrol unit VC_TIAC_{self.spawn_counter} at location {location} with patrol state {patrol_state}")

        self.spawn_counter += 1
        
    def spawn_red_truck(self, location, destination):
        if not self.api:
            return

        units = [
            UnitSpawnTable(
                name=f"VC_TIAC_TRUCK_{self.spawn_counter}",
                unit_type="Bedford_MWD",
                location=location,
                skill="Average",
                altitude=0,
                heading=random.randint(0, 360),
            )
        ]

        if self.spawn_counter < self.max_units:
            self.api.spawn_ground_units(
                units=units,
                coalition="neutral",
                country="",  # Pick a valid neutral country in your mission.
                immediate=True,
                spawnPoints=0,
                groupName=f"VC_TIAC_TRUCK_{self.spawn_counter}",
                execution_callback=lambda ID: self.spawn_truck_execution_callback(ID, destination),
            )
            self.logger.info(f"Spawning red truck unit VC_TIAC_TRUCK_{self.spawn_counter} at location {location} with destination {destination}")
            # After spawning, we need to set the truck to move towards the destination
            # We will do this in the on_update loop by checking for units with the name pattern "VC_TIAC_TRUCK_" and setting their path towards the destination, we can store the destination in a dict with the unit ID as the key when we spawn them and then retrieve it in the on_update loop to set their path towards it

        self.spawn_counter += 1

    async def spawn_execution_callback(self, ID, patrol_state, town_centre):
        self.pending_spawn_initializations[ID] = {
            "unit_type": "Infantry",
            "state": patrol_state,
            "town_centre": town_centre
        }
        
    async def spawn_truck_execution_callback(self, ID, destination):
        self.pending_spawn_initializations[ID] = {
            "unit_type": "Truck",
            "destination": destination
        }

    def apply_pending_spawn_initializations(self, units: dict[int, Unit]):
        mission = self.api.get_mission()
        if not self.pending_spawn_initializations:
            return

        resolved_ids = []
        iteration_load = 0
        for result_id, init_data in self.pending_spawn_initializations.items():
            for unit in units.values():
                if mission.get('load', 100) < 100 and iteration_load < 25 and unit.unit_id == result_id:
                    if init_data["unit_type"] == "Infantry":
                        unit.__class__ = EnemyPatrolsUnit
                        iteration_load += unit.set_patrol_state(init_data["state"], init_data["town_centre"])
                    elif init_data["unit_type"] == "Truck":
                        unit.set_path([init_data["destination"]])
                        unit.set_speed(5)
                        unit.set_operate_as(coalition_to_enum("red"))
                    resolved_ids.append(result_id)
                    break

        for result_id in resolved_ids:
            del self.pending_spawn_initializations[result_id]
                        
    def get_all_zones(self):
        try:
            mission = self.api.update_mission()
            mission_triggers = mission.get("triggers", {})
            # Make an array of the zones for blue and then red.
            zones = []
            spawn_zones = []
            town_centres = []
            jungle_zones = []
            centre_zones = []
            for trigger in mission_triggers:
                zone_name = mission_triggers[trigger].get("name", "")
                if re.match(r"^[tT][cC]-.+-\d+$", zone_name):
                    town_centres.append(mission_triggers[trigger])  # Adds the zone to the town centres list.
                elif re.match(r"^[sS][vV]-.+-\d+$", zone_name) or re.match(r"^[lL][vV]-.+-\d+$", zone_name) or re.match(r"^[sS][hH]-.+-\d+$", zone_name):
                    spawn_zones.append(mission_triggers[trigger])  # Adds the zone to the spawn zones list.
                elif re.match(r"^[jJ][zZ]-.+-\d+$", zone_name):
                    jungle_zones.append(mission_triggers[trigger])  # Adds the zone to the jungle zones list.
                elif re.match(r"^[iI][mM]-\d+$", zone_name):
                    centre_zones.append(mission_triggers[trigger])  # Adds the zone to the centre zones list.

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
        # Or a `LatLng`-like object with `lat` and `lng` attributes.
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
