from typing import List
import asyncio

from data.data_extractor import DataExtractor
from data.data_indexes import DataIndexes
from data.data_types import LatLng, TACAN, Radio, GeneralSettings, Ammo, Contact, Offset
from data.roes import ROES
from data.states import states
from utils.utils import enum_to_coalition

class Unit:
    def __init__(self, id: int, api):
        from api import API

        self.ID = id
        self.api: API = api

        # Data controlled directly by the backend
        self.category = ""
        self.alive = False
        self.alarm_state = "AUTO"
        self.human = False
        self.controlled = False
        self.coalition = "neutral"
        self.country = 0
        self.name = ""
        self.unit_name = ""
        self.callsign = ""
        self.group_id = 0
        self.unit_id = 0
        self.group_name = ""
        self.state = ""
        self.task = ""
        self.has_task = False
        self.position = LatLng(0, 0, 0)
        self.speed = 0.0
        self.horizontal_velocity = 0.0
        self.vertical_velocity = 0.0
        self.heading = 0.0
        self.track = 0.0
        self.is_active_tanker = False
        self.is_active_awacs = False
        self.on_off = True
        self.follow_roads = False
        self.fuel = 0
        self.desired_speed = 0.0
        self.desired_speed_type = "CAS"
        self.desired_altitude = 0.0
        self.desired_altitude_type = "ASL"
        self.leader_id = 0
        self.formation_offset = Offset(0, 0, 0)
        self.target_id = 0
        self.target_position = LatLng(0, 0, 0)
        self.roe = ""
        self.reaction_to_threat = ""
        self.emissions_countermeasures = ""
        self.tacan = TACAN(False, 0, "X", "TKR")
        self.radio = Radio(124000000, 1, 1)
        self.general_settings = GeneralSettings(False, False, False, False, False)
        self.ammo: List[Ammo] = []
        self.contacts: List[Contact] = []
        self.active_path: List[LatLng] = []
        self.is_leader = False
        self.operate_as = "blue"
        self.shots_scatter = 2
        self.shots_intensity = 2
        self.health = 100
        self.racetrack_length = 0.0
        self.racetrack_anchor = LatLng(0, 0, 0)
        self.racetrack_bearing = 0.0
        self.airborne = False
        self.radar_state = False
        self.time_to_next_tasking = 0.0
        self.barrel_height = 0.0
        self.muzzle_velocity = 0.0
        self.aim_time = 0.0
        self.shots_to_fire = 0
        self.shots_base_interval = 0.0
        self.shots_base_scatter = 0.0
        self.engagement_range = 0.0
        self.targeting_range = 0.0
        self.aim_method_range = 0.0
        self.acquisition_range = 0.0
        
        self.previous_total_ammo = 0
        self.total_ammo = 0
        
        self.on_property_change_callbacks = {}
        self.on_destination_reached_callback = None
        self.destination = None
        self.destination_reached_threshold = 10
        self.destination_reached_timeout = None
        self.destination_reached_start_time = None
        
    def __repr__(self):
        return f"Unit(id={self.ID}, name={self.name}, coalition={self.coalition}, position={self.position})"
    
    def register_on_property_change_callback(self, property_name: str, callback):
        """
        Register a callback function that will be called when a property changes.
        Args:
            property_name (str): The name of the property to watch.
            callback (function): The function to call when the property changes. The callback should accept two parameters: the unit and the new value of the property.
        """
        if property_name not in self.on_property_change_callbacks:
            self.on_property_change_callbacks[property_name] = callback
            
    def unregister_on_property_change_callback(self, property_name: str):
        """
        Unregister a callback function for a property.
        Args:
            property_name (str): The name of the property to stop watching.
        """
        if property_name in self.on_property_change_callbacks:
            del self.on_property_change_callbacks[property_name]
            
    def register_on_destination_reached_callback(self, callback, destination: LatLng, threshold: float = 10, timeout: float = None):
        """
        Register a callback function that will be called when the unit reaches its destination.
        If the destination is not reached within the specified timeout, the callback will also be called with `False`.
        
        Args:
            callback (function): The function to call when the destination is reached. The callback should accept two parameters: the unit and a boolean indicating whether the destination was reached.
            destination (LatLng): The destination that the unit is expected to reach.
            threshold (float): The distance threshold in meters to consider the destination reached. Default is 10 meters.
        """
        self.on_destination_reached_callback = callback
        self.destination = destination
        self.destination_reached_threshold = threshold
        self.destination_reached_timeout = timeout
        self.destination_reached_start_time = asyncio.get_event_loop().time() if timeout else None
        
    def unregister_on_destination_reached_callback(self):
        """
        Unregister the callback function for destination reached.
        """
        self.on_destination_reached_callback = None
        self.destination = None
        
    def _trigger_callback(self, property_name: str, value):
        """
        Trigger a property change callback, executing it in the asyncio event loop if available.
        Args:
            property_name (str): The name of the property that changed.
            value: The new value of the property.
        """
        if property_name in self.on_property_change_callbacks:
            callback = self.on_property_change_callbacks[property_name]
            try:
                # Try to get the current event loop and schedule the callback
                loop = asyncio.get_running_loop()
                loop.create_task(self._run_callback_async(callback, self, value))
            except RuntimeError:
                # No event loop running, execute synchronously
                callback(self, value)
    
    async def _run_callback_async(self, callback, *args):
        """
        Run a callback asynchronously, handling both sync and async callbacks.
        """
        try:
            if asyncio.iscoroutinefunction(callback):
                await callback(*args)
            else:
                callback(*args)
        except Exception as e:
            # Log the error but don't crash the update process
            print(f"Error in property change callback: {e}")

    def _trigger_destination_reached_callback(self, reached: bool):
        """
        Trigger the destination reached callback, executing it in the asyncio event loop if available.
        Args:
            reached (bool): Whether the destination was reached or not.
        """
        if self.on_destination_reached_callback:
            try:
                # Try to get the current event loop and schedule the callback
                loop = asyncio.get_running_loop()
                loop.create_task(self._run_callback_async(self.on_destination_reached_callback, self, reached))
            except RuntimeError:
                # No event loop running, execute synchronously
                self.on_destination_reached_callback(self, reached)
        
    def update_from_data_extractor(self, data_extractor: DataExtractor):
        datum_index = 0
        
        while datum_index != DataIndexes.END_OF_DATA.value:
            datum_index = data_extractor.extract_uint8()
            
            if datum_index == DataIndexes.CATEGORY.value:
                category = data_extractor.extract_string()
                if category != self.category:
                    self.category = category
                    # Trigger callbacks for property change
                    if "category" in self.on_property_change_callbacks:
                        self._trigger_callback("category", self.category)
            elif datum_index == DataIndexes.ALIVE.value:
                alive = data_extractor.extract_bool()
                if alive != self.alive:
                    self.alive = alive
                    # Trigger callbacks for property change
                    if "alive" in self.on_property_change_callbacks:
                        self._trigger_callback("alive", self.alive)
            elif datum_index == DataIndexes.RADAR_STATE.value:
                radar_state = data_extractor.extract_bool()
                if radar_state != self.radar_state:
                    self.radar_state = radar_state
                    # Trigger callbacks for property change
                    if "radar_state" in self.on_property_change_callbacks:
                        self._trigger_callback("radar_state", self.radar_state)
            elif datum_index == DataIndexes.HUMAN.value:
                human = data_extractor.extract_bool()
                if human != self.human:
                    self.human = human
                    # Trigger callbacks for property change
                    if "human" in self.on_property_change_callbacks:
                        self._trigger_callback("human", self.human)
            elif datum_index == DataIndexes.CONTROLLED.value:
                controlled = data_extractor.extract_bool()
                if controlled != self.controlled:
                    self.controlled = controlled
                    # Trigger callbacks for property change
                    if "controlled" in self.on_property_change_callbacks:
                        self._trigger_callback("controlled", self.controlled)
            elif datum_index == DataIndexes.COALITION.value:
                coalition = enum_to_coalition(data_extractor.extract_uint8())
                if coalition != self.coalition:
                    self.coalition = coalition
                    # Trigger callbacks for property change
                    if "coalition" in self.on_property_change_callbacks:
                        self._trigger_callback("coalition", self.coalition)
            elif datum_index == DataIndexes.COUNTRY.value:
                country = data_extractor.extract_uint8()
                if country != self.country:
                    self.country = country
                    # Trigger callbacks for property change
                    if "country" in self.on_property_change_callbacks:
                        self._trigger_callback("country", self.country)
            elif datum_index == DataIndexes.NAME.value:
                name = data_extractor.extract_string()
                if name != self.name:
                    self.name = name
                    # Trigger callbacks for property change
                    if "name" in self.on_property_change_callbacks:
                        self._trigger_callback("name", self.name)
            elif datum_index == DataIndexes.UNIT_NAME.value:
                unit_name = data_extractor.extract_string()
                if unit_name != self.unit_name:
                    self.unit_name = unit_name
                    # Trigger callbacks for property change
                    if "unit_name" in self.on_property_change_callbacks:
                        self._trigger_callback("unit_name", self.unit_name)
            elif datum_index == DataIndexes.CALLSIGN.value:
                callsign = data_extractor.extract_string()
                if callsign != self.callsign:
                    self.callsign = callsign
                    # Trigger callbacks for property change
                    if "callsign" in self.on_property_change_callbacks:
                        self._trigger_callback("callsign", self.callsign)
            elif datum_index == DataIndexes.UNIT_ID.value:
                unit_id = data_extractor.extract_uint32()
                if unit_id != self.unit_id:
                    self.unit_id = unit_id
                    # Trigger callbacks for property change
                    if "unit_id" in self.on_property_change_callbacks:
                        self._trigger_callback("unit_id", self.unit_id)
            elif datum_index == DataIndexes.GROUP_ID.value:
                group_id = data_extractor.extract_uint32()
                if group_id != self.group_id:
                    self.group_id = group_id
                    # Trigger callbacks for property change
                    if "group_id" in self.on_property_change_callbacks:
                        self._trigger_callback("group_id", self.group_id)
            elif datum_index == DataIndexes.GROUP_NAME.value:
                group_name = data_extractor.extract_string()
                if group_name != self.group_name:
                    self.group_name = group_name
                    # Trigger callbacks for property change
                    if "group_name" in self.on_property_change_callbacks:
                        self._trigger_callback("group_name", self.group_name)
            elif datum_index == DataIndexes.STATE.value:
                state = states[data_extractor.extract_uint8()]
                if state != self.state:
                    self.state = state
                    # Trigger callbacks for property change
                    if "state" in self.on_property_change_callbacks:
                        self._trigger_callback("state", self.state)
            elif datum_index == DataIndexes.TASK.value:
                task = data_extractor.extract_string()
                if task != self.task:
                    self.task = task
                    # Trigger callbacks for property change
                    if "task" in self.on_property_change_callbacks:
                        self._trigger_callback("task", self.task)
            elif datum_index == DataIndexes.HAS_TASK.value:
                has_task = data_extractor.extract_bool()
                if has_task != self.has_task:
                    self.has_task = has_task
                    # Trigger callbacks for property change
                    if "has_task" in self.on_property_change_callbacks:
                        self._trigger_callback("has_task", self.has_task)
            elif datum_index == DataIndexes.POSITION.value:
                position = data_extractor.extract_lat_lng()
                if position != self.position:
                    self.position = position
                    # Trigger callbacks for property change
                    if "position" in self.on_property_change_callbacks:
                        self._trigger_callback("position", self.position)
                        
                    if self.on_destination_reached_callback and self.destination:
                        reached = self.position.distance_to(self.destination) < self.destination_reached_threshold
                        if reached or (
                            self.destination_reached_timeout and
                            (asyncio.get_event_loop().time() - self.destination_reached_start_time) > self.destination_reached_timeout
                        ):
                            self._trigger_destination_reached_callback(reached)
                            self.unregister_on_destination_reached_callback()
            elif datum_index == DataIndexes.SPEED.value:
                speed = data_extractor.extract_float64()
                if speed != self.speed:
                    self.speed = speed
                    # Trigger callbacks for property change
                    if "speed" in self.on_property_change_callbacks:
                        self._trigger_callback("speed", self.speed)
            elif datum_index == DataIndexes.HORIZONTAL_VELOCITY.value:
                horizontal_velocity = data_extractor.extract_float64()
                if horizontal_velocity != self.horizontal_velocity:
                    self.horizontal_velocity = horizontal_velocity
                    # Trigger callbacks for property change
                    if "horizontal_velocity" in self.on_property_change_callbacks:
                        self._trigger_callback("horizontal_velocity", self.horizontal_velocity)
            elif datum_index == DataIndexes.VERTICAL_VELOCITY.value:
                vertical_velocity = data_extractor.extract_float64()
                if vertical_velocity != self.vertical_velocity:
                    self.vertical_velocity = vertical_velocity
                    # Trigger callbacks for property change
                    if "vertical_velocity" in self.on_property_change_callbacks:
                        self._trigger_callback("vertical_velocity", self.vertical_velocity)
            elif datum_index == DataIndexes.HEADING.value:
                heading = data_extractor.extract_float64()
                if heading != self.heading:
                    self.heading = heading
                    # Trigger callbacks for property change
                    if "heading" in self.on_property_change_callbacks:
                        self._trigger_callback("heading", self.heading)
            elif datum_index == DataIndexes.TRACK.value:
                track = data_extractor.extract_float64()
                if track != self.track:
                    self.track = track
                    # Trigger callbacks for property change
                    if "track" in self.on_property_change_callbacks:
                        self._trigger_callback("track", self.track)
            elif datum_index == DataIndexes.IS_ACTIVE_TANKER.value:
                is_active_tanker = data_extractor.extract_bool()
                if is_active_tanker != self.is_active_tanker:
                    self.is_active_tanker = is_active_tanker
                    # Trigger callbacks for property change
                    if "is_active_tanker" in self.on_property_change_callbacks:
                        self._trigger_callback("is_active_tanker", self.is_active_tanker)
            elif datum_index == DataIndexes.IS_ACTIVE_AWACS.value:
                is_active_awacs = data_extractor.extract_bool()
                if is_active_awacs != self.is_active_awacs:
                    self.is_active_awacs = is_active_awacs
                    # Trigger callbacks for property change
                    if "is_active_awacs" in self.on_property_change_callbacks:
                        self._trigger_callback("is_active_awacs", self.is_active_awacs)
            elif datum_index == DataIndexes.ON_OFF.value:
                on_off = data_extractor.extract_bool()
                if on_off != self.on_off:
                    self.on_off = on_off
                    # Trigger callbacks for property change
                    if "on_off" in self.on_property_change_callbacks:
                        self._trigger_callback("on_off", self.on_off)
            elif datum_index == DataIndexes.FOLLOW_ROADS.value:
                follow_roads = data_extractor.extract_bool()
                if follow_roads != self.follow_roads:
                    self.follow_roads = follow_roads
                    # Trigger callbacks for property change
                    if "follow_roads" in self.on_property_change_callbacks:
                        self._trigger_callback("follow_roads", self.follow_roads)
            elif datum_index == DataIndexes.FUEL.value:
                fuel = data_extractor.extract_uint16()
                if fuel != self.fuel:
                    self.fuel = fuel
                    # Trigger callbacks for property change
                    if "fuel" in self.on_property_change_callbacks:
                        self._trigger_callback("fuel", self.fuel)
            elif datum_index == DataIndexes.DESIRED_SPEED.value:
                desired_speed = data_extractor.extract_float64()
                if desired_speed != self.desired_speed:
                    self.desired_speed = desired_speed
                    # Trigger callbacks for property change
                    if "desired_speed" in self.on_property_change_callbacks:
                        self._trigger_callback("desired_speed", self.desired_speed)
            elif datum_index == DataIndexes.DESIRED_SPEED_TYPE.value:
                desired_speed_type = "GS" if data_extractor.extract_bool() else "CAS"
                if desired_speed_type != self.desired_speed_type:
                    self.desired_speed_type = desired_speed_type
                    # Trigger callbacks for property change
                    if "desired_speed_type" in self.on_property_change_callbacks:
                        self._trigger_callback("desired_speed_type", self.desired_speed_type)
            elif datum_index == DataIndexes.DESIRED_ALTITUDE.value:
                desired_altitude = data_extractor.extract_float64()
                if desired_altitude != self.desired_altitude:
                    self.desired_altitude = desired_altitude
                    # Trigger callbacks for property change
                    if "desired_altitude" in self.on_property_change_callbacks:
                        self._trigger_callback("desired_altitude", self.desired_altitude)
            elif datum_index == DataIndexes.DESIRED_ALTITUDE_TYPE.value:
                desired_altitude_type = "AGL" if data_extractor.extract_bool() else "ASL"
                if desired_altitude_type != self.desired_altitude_type:
                    self.desired_altitude_type = desired_altitude_type
                    # Trigger callbacks for property change
                    if "desired_altitude_type" in self.on_property_change_callbacks:
                        self._trigger_callback("desired_altitude_type", self.desired_altitude_type)
            elif datum_index == DataIndexes.LEADER_ID.value:
                leader_id = data_extractor.extract_uint32()
                if leader_id != self.leader_id:
                    self.leader_id = leader_id
                    # Trigger callbacks for property change
                    if "leader_id" in self.on_property_change_callbacks:
                        self._trigger_callback("leader_id", self.leader_id)
            elif datum_index == DataIndexes.FORMATION_OFFSET.value:
                formation_offset = data_extractor.extract_offset()
                if formation_offset != self.formation_offset:
                    self.formation_offset = formation_offset
                    # Trigger callbacks for property change
                    if "formation_offset" in self.on_property_change_callbacks:
                        self._trigger_callback("formation_offset", self.formation_offset)
            elif datum_index == DataIndexes.TARGET_ID.value:
                target_id = data_extractor.extract_uint32()
                if target_id != self.target_id:
                    self.target_id = target_id
                    # Trigger callbacks for property change
                    if "target_id" in self.on_property_change_callbacks:
                        self._trigger_callback("target_id", self.target_id)
            elif datum_index == DataIndexes.TARGET_POSITION.value:
                target_position = data_extractor.extract_lat_lng()
                if target_position != self.target_position:
                    self.target_position = target_position
                    # Trigger callbacks for property change
                    if "target_position" in self.on_property_change_callbacks:
                        self._trigger_callback("target_position", self.target_position)
            elif datum_index == DataIndexes.ROE.value:
                roe = ROES[data_extractor.extract_uint8()]
                if roe != self.roe:
                    self.roe = roe
                    # Trigger callbacks for property change
                    if "roe" in self.on_property_change_callbacks:
                        self._trigger_callback("roe", self.roe)
            elif datum_index == DataIndexes.ALARM_STATE.value:
                alarm_state = self.enum_to_alarm_state(data_extractor.extract_uint8())
                if alarm_state != self.alarm_state:
                    self.alarm_state = alarm_state
                    # Trigger callbacks for property change
                    if "alarm_state" in self.on_property_change_callbacks:
                        self._trigger_callback("alarm_state", self.alarm_state)
            elif datum_index == DataIndexes.REACTION_TO_THREAT.value:
                reaction_to_threat = self.enum_to_reaction_to_threat(data_extractor.extract_uint8())
                if reaction_to_threat != self.reaction_to_threat:
                    self.reaction_to_threat = reaction_to_threat
                    # Trigger callbacks for property change
                    if "reaction_to_threat" in self.on_property_change_callbacks:
                        self._trigger_callback("reaction_to_threat", self.reaction_to_threat)
            elif datum_index == DataIndexes.EMISSIONS_COUNTERMEASURES.value:
                emissions_countermeasures = self.enum_to_emission_countermeasure(data_extractor.extract_uint8())
                if emissions_countermeasures != self.emissions_countermeasures:
                    self.emissions_countermeasures = emissions_countermeasures
                    # Trigger callbacks for property change
                    if "emissions_countermeasures" in self.on_property_change_callbacks:
                        self._trigger_callback("emissions_countermeasures", self.emissions_countermeasures)
            elif datum_index == DataIndexes.TACAN.value:
                tacan = data_extractor.extract_tacan()
                if tacan != self.tacan:
                    self.tacan = tacan
                    # Trigger callbacks for property change
                    if "tacan" in self.on_property_change_callbacks:
                        self._trigger_callback("tacan", self.tacan)
            elif datum_index == DataIndexes.RADIO.value:
                radio = data_extractor.extract_radio()
                if radio != self.radio:
                    self.radio = radio
                    # Trigger callbacks for property change
                    if "radio" in self.on_property_change_callbacks:
                        self._trigger_callback("radio", self.radio)
            elif datum_index == DataIndexes.GENERAL_SETTINGS.value:
                general_settings = data_extractor.extract_general_settings()
                if general_settings != self.general_settings:
                    self.general_settings = general_settings
                    # Trigger callbacks for property change
                    if "general_settings" in self.on_property_change_callbacks:
                        self._trigger_callback("general_settings", self.general_settings)
            elif datum_index == DataIndexes.AMMO.value:
                ammo = data_extractor.extract_ammo()
                if ammo != self.ammo:
                    self.ammo = ammo
                    self.previous_total_ammo = self.total_ammo
                    self.total_ammo = sum(ammo.quantity for ammo in self.ammo)
                    # Trigger callbacks for property change
                    if "ammo" in self.on_property_change_callbacks:
                        self._trigger_callback("ammo", self.ammo)
            elif datum_index == DataIndexes.CONTACTS.value:
                contacts = data_extractor.extract_contacts()
                if contacts != self.contacts:
                    self.contacts = contacts
                    # Trigger callbacks for property change
                    if "contacts" in self.on_property_change_callbacks:
                        self._trigger_callback("contacts", self.contacts)
            elif datum_index == DataIndexes.ACTIVE_PATH.value:
                active_path = data_extractor.extract_active_path()
                if active_path != self.active_path:
                    self.active_path = active_path
                    # Trigger callbacks for property change
                    if "active_path" in self.on_property_change_callbacks:
                        self._trigger_callback("active_path", self.active_path)
            elif datum_index == DataIndexes.IS_LEADER.value:
                is_leader = data_extractor.extract_bool()
                if is_leader != self.is_leader:
                    self.is_leader = is_leader
                    # Trigger callbacks for property change
                    if "is_leader" in self.on_property_change_callbacks:
                        self._trigger_callback("is_leader", self.is_leader)
            elif datum_index == DataIndexes.OPERATE_AS.value:
                operate_as = enum_to_coalition(data_extractor.extract_uint8())
                if operate_as != self.operate_as:
                    self.operate_as = operate_as
                    # Trigger callbacks for property change
                    if "operate_as" in self.on_property_change_callbacks:
                        self._trigger_callback("operate_as", self.operate_as)
            elif datum_index == DataIndexes.SHOTS_SCATTER.value:
                shots_scatter = data_extractor.extract_uint8()
                if shots_scatter != self.shots_scatter:
                    self.shots_scatter = shots_scatter
                    # Trigger callbacks for property change
                    if "shots_scatter" in self.on_property_change_callbacks:
                        self._trigger_callback("shots_scatter", self.shots_scatter)
            elif datum_index == DataIndexes.SHOTS_INTENSITY.value:
                shots_intensity = data_extractor.extract_uint8()
                if shots_intensity != self.shots_intensity:
                    self.shots_intensity = shots_intensity
                    # Trigger callbacks for property change
                    if "shots_intensity" in self.on_property_change_callbacks:
                        self._trigger_callback("shots_intensity", self.shots_intensity)
            elif datum_index == DataIndexes.HEALTH.value:
                health = data_extractor.extract_uint8()
                if health != self.health:
                    self.health = health
                    # Trigger callbacks for property change
                    if "health" in self.on_property_change_callbacks:
                        self._trigger_callback("health", self.health)
            elif datum_index == DataIndexes.RACETRACK_LENGTH.value:
                racetrack_length = data_extractor.extract_float64()
                if racetrack_length != self.racetrack_length:
                    self.racetrack_length = racetrack_length
                    # Trigger callbacks for property change
                    if "racetrack_length" in self.on_property_change_callbacks:
                        self._trigger_callback("racetrack_length", self.racetrack_length)
            elif datum_index == DataIndexes.RACETRACK_ANCHOR.value:
                racetrack_anchor = data_extractor.extract_lat_lng()
                if racetrack_anchor != self.racetrack_anchor:
                    self.racetrack_anchor = racetrack_anchor
                    # Trigger callbacks for property change
                    if "racetrack_anchor" in self.on_property_change_callbacks:
                        self._trigger_callback("racetrack_anchor", self.racetrack_anchor)
            elif datum_index == DataIndexes.RACETRACK_BEARING.value:
                racetrack_bearing = data_extractor.extract_float64()
                if racetrack_bearing != self.racetrack_bearing:
                    self.racetrack_bearing = racetrack_bearing
                    # Trigger callbacks for property change
                    if "racetrack_bearing" in self.on_property_change_callbacks:
                        self._trigger_callback("racetrack_bearing", self.racetrack_bearing)
            elif datum_index == DataIndexes.TIME_TO_NEXT_TASKING.value:
                time_to_next_tasking = data_extractor.extract_float64()
                if time_to_next_tasking != self.time_to_next_tasking:
                    self.time_to_next_tasking = time_to_next_tasking
                    # Trigger callbacks for property change
                    if "time_to_next_tasking" in self.on_property_change_callbacks:
                        self._trigger_callback("time_to_next_tasking", self.time_to_next_tasking)
            elif datum_index == DataIndexes.BARREL_HEIGHT.value:
                barrel_height = data_extractor.extract_float64()
                if barrel_height != self.barrel_height:
                    self.barrel_height = barrel_height
                    # Trigger callbacks for property change
                    if "barrel_height" in self.on_property_change_callbacks:
                        self._trigger_callback("barrel_height", self.barrel_height)
            elif datum_index == DataIndexes.MUZZLE_VELOCITY.value:
                muzzle_velocity = data_extractor.extract_float64()
                if muzzle_velocity != self.muzzle_velocity:
                    self.muzzle_velocity = muzzle_velocity
                    # Trigger callbacks for property change
                    if "muzzle_velocity" in self.on_property_change_callbacks:
                        self._trigger_callback("muzzle_velocity", self.muzzle_velocity)
            elif datum_index == DataIndexes.AIM_TIME.value:
                aim_time = data_extractor.extract_float64()
                if aim_time != self.aim_time:
                    self.aim_time = aim_time
                    # Trigger callbacks for property change
                    if "aim_time" in self.on_property_change_callbacks:
                        self._trigger_callback("aim_time", self.aim_time)
            elif datum_index == DataIndexes.SHOTS_TO_FIRE.value:
                shots_to_fire = data_extractor.extract_uint32()
                if shots_to_fire != self.shots_to_fire:
                    self.shots_to_fire = shots_to_fire
                    # Trigger callbacks for property change
                    if "shots_to_fire" in self.on_property_change_callbacks:
                        self._trigger_callback("shots_to_fire", self.shots_to_fire)
            elif datum_index == DataIndexes.SHOTS_BASE_INTERVAL.value:
                shots_base_interval = data_extractor.extract_float64()
                if shots_base_interval != self.shots_base_interval:
                    self.shots_base_interval = shots_base_interval
                    # Trigger callbacks for property change
                    if "shots_base_interval" in self.on_property_change_callbacks:
                        self._trigger_callback("shots_base_interval", self.shots_base_interval)
            elif datum_index == DataIndexes.SHOTS_BASE_SCATTER.value:
                shots_base_scatter = data_extractor.extract_float64()
                if shots_base_scatter != self.shots_base_scatter:
                    self.shots_base_scatter = shots_base_scatter
                    # Trigger callbacks for property change
                    if "shots_base_scatter" in self.on_property_change_callbacks:
                        self._trigger_callback("shots_base_scatter", self.shots_base_scatter)
            elif datum_index == DataIndexes.ENGAGEMENT_RANGE.value:
                engagement_range = data_extractor.extract_float64()
                if engagement_range != self.engagement_range:
                    self.engagement_range = engagement_range
                    # Trigger callbacks for property change
                    if "engagement_range" in self.on_property_change_callbacks:
                        self._trigger_callback("engagement_range", self.engagement_range)
            elif datum_index == DataIndexes.TARGETING_RANGE.value:
                targeting_range = data_extractor.extract_float64()
                if targeting_range != self.targeting_range:
                    self.targeting_range = targeting_range
                    # Trigger callbacks for property change
                    if "targeting_range" in self.on_property_change_callbacks:
                        self._trigger_callback("targeting_range", self.targeting_range)
            elif datum_index == DataIndexes.AIM_METHOD_RANGE.value:
                aim_method_range = data_extractor.extract_float64()
                if aim_method_range != self.aim_method_range:
                    self.aim_method_range = aim_method_range
                    # Trigger callbacks for property change
                    if "aim_method_range" in self.on_property_change_callbacks:
                        self._trigger_callback("aim_method_range", self.aim_method_range)
            elif datum_index == DataIndexes.ACQUISITION_RANGE.value:
                acquisition_range = data_extractor.extract_float64()
                if acquisition_range != self.acquisition_range:
                    self.acquisition_range = acquisition_range
                    # Trigger callbacks for property change
                    if "acquisition_range" in self.on_property_change_callbacks:
                        self._trigger_callback("acquisition_range", self.acquisition_range)
            elif datum_index == DataIndexes.AIRBORNE.value:
                airborne = data_extractor.extract_bool()
                if airborne != self.airborne:
                    self.airborne = airborne
                    # Trigger callbacks for property change
                    if "airborne" in self.on_property_change_callbacks:
                        self._trigger_callback("airborne", self.airborne)
    
    # --- API functions requiring ID ---
    def set_path(self, path: List[LatLng]):
        return self.api.send_command({"setPath": {"ID": self.ID, "path": [latlng.toJSON() for latlng in path]}})

    def attack_unit(self, target_id: int):
        return self.api.send_command({"attackUnit": {"ID": self.ID, "targetID": target_id}})

    def follow_unit(self, target_id: int, offset_x=0, offset_y=0, offset_z=0):
        return self.api.send_command({"followUnit": {"ID": self.ID, "targetID": target_id, "offsetX": offset_x, "offsetY": offset_y, "offsetZ": offset_z}})

    def delete_unit(self, explosion=False, explosion_type="", immediate=True):
        return self.api.send_command({"deleteUnit": {"ID": self.ID, "explosion": explosion, "explosionType": explosion_type, "immediate": immediate}})

    def land_at(self, location: LatLng):
        return self.api.send_command({"landAt": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}}})

    def change_speed(self, change: str):
        return self.api.send_command({"changeSpeed": {"ID": self.ID, "change": change}})

    def set_speed(self, speed: float):
        return self.api.send_command({"setSpeed": {"ID": self.ID, "speed": speed}})

    def set_speed_type(self, speed_type: str):
        return self.api.send_command({"setSpeedType": {"ID": self.ID, "speedType": speed_type}})

    def change_altitude(self, change: str):
        return self.api.send_command({"changeAltitude": {"ID": self.ID, "change": change}})

    def set_altitude_type(self, altitude_type: str):
        return self.api.send_command({"setAltitudeType": {"ID": self.ID, "altitudeType": altitude_type}})

    def set_altitude(self, altitude: float):
        return self.api.send_command({"setAltitude": {"ID": self.ID, "altitude": altitude}})

    def set_roe(self, roe: int):
        return self.api.send_command({"setROE": {"ID": self.ID, "ROE": roe}})

    def set_alarm_state(self, alarm_state: int):
        return self.api.send_command({"setAlarmState": {"ID": self.ID, "alarmState": alarm_state}})

    def set_reaction_to_threat(self, reaction_to_threat: int):
        return self.api.send_command({"setReactionToThreat": {"ID": self.ID, "reactionToThreat": reaction_to_threat}})

    def set_emissions_countermeasures(self, emissions_countermeasures: int):
        return self.api.send_command({"setEmissionsCountermeasures": {"ID": self.ID, "emissionsCountermeasures": emissions_countermeasures}})

    def set_on_off(self, on_off: bool):
        return self.api.send_command({"setOnOff": {"ID": self.ID, "onOff": on_off}})

    def set_follow_roads(self, follow_roads: bool):
        return self.api.send_command({"setFollowRoads": {"ID": self.ID, "followRoads": follow_roads}})

    def set_operate_as(self, operate_as: int):
        return self.api.send_command({"setOperateAs": {"ID": self.ID, "operateAs": operate_as}})

    def refuel(self):
        return self.api.send_command({"refuel": {"ID": self.ID}})

    def bomb_point(self, location: LatLng):
        return self.api.send_command({"bombPoint": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}}})

    def carpet_bomb(self, location: LatLng):
        return self.api.send_command({"carpetBomb": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}}})

    def bomb_building(self, location: LatLng):
        return self.api.send_command({"bombBuilding": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}}})

    def fire_at_area(self, location: LatLng):
        return self.api.send_command({"fireAtArea": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}}})

    def fire_laser(self, location: LatLng, code: int):
        return self.api.send_command({"fireLaser": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}, "code": code}})

    def fire_infrared(self, location: LatLng):
        return self.api.send_command({"fireInfrared": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}}})

    def simulate_fire_fight(self, location: LatLng, altitude: float):
        return self.api.send_command({"simulateFireFight": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}, "altitude": altitude}})

    def scenic_aaa(self, coalition: str):
        return self.api.send_command({"scenicAAA": {"ID": self.ID, "coalition": coalition}})

    def miss_on_purpose(self, coalition: str):
        return self.api.send_command({"missOnPurpose": {"ID": self.ID, "coalition": coalition}})

    def land_at_point(self, location: LatLng):
        return self.api.send_command({"landAtPoint": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}}})

    def set_shots_scatter(self, shots_scatter: int):
        return self.api.send_command({"setShotsScatter": {"ID": self.ID, "shotsScatter": shots_scatter}})

    def set_shots_intensity(self, shots_intensity: int):
        return self.api.send_command({"setShotsIntensity": {"ID": self.ID, "shotsIntensity": shots_intensity}})

    def set_racetrack(self, location: LatLng, bearing: float, length: float):
        return self.api.send_command({"setRacetrack": {"ID": self.ID, "location": {"lat": location.lat, "lng": location.lng}, "bearing": bearing, "length": length}})

    def set_advanced_options(self, is_active_tanker: bool, is_active_awacs: bool, tacan: dict, radio: dict, general_settings: dict):
        return self.api.send_command({"setAdvancedOptions": {"ID": self.ID, "isActiveTanker": is_active_tanker, "isActiveAWACS": is_active_awacs, "TACAN": tacan, "radio": radio, "generalSettings": general_settings}})

    def set_engagement_properties(self, barrel_height, muzzle_velocity, aim_time, shots_to_fire, shots_base_interval, shots_base_scatter, engagement_range, targeting_range, aim_method_range, acquisition_range):
        return self.api.send_command({"setEngagementProperties": {"ID": self.ID, "barrelHeight": barrel_height, "muzzleVelocity": muzzle_velocity, "aimTime": aim_time, "shotsToFire": shots_to_fire, "shotsBaseInterval": shots_base_interval, "shotsBaseScatter": shots_base_scatter, "engagementRange": engagement_range, "targetingRange": targeting_range, "aimMethodRange": aim_method_range, "acquisitionRange": acquisition_range}})
                
    
        
        