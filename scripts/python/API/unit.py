from data_extractor import DataExtractor
from data_indexes import DataIndexes
from data_types import LatLng, TACAN, Radio, GeneralSettings, Ammo, Contact, Offset
from typing import List

from roes import ROES
from states import states
from utils import enum_to_coalition

class Unit:
    def __init__(self, id: int):
        self.ID = id
        
        # Data controlled directly by the backend
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
        
        self.previous_total_ammo = 0
        self.total_ammo = 0
        
    def __repr__(self):
        return f"Unit(id={self.ID}, name={self.name}, coalition={self.coalition}, position={self.position})"
        
    def update_from_data_extractor(self, data_extractor: DataExtractor):
        datum_index = 0
        
        while datum_index != DataIndexes.END_OF_DATA.value:
            datum_index = data_extractor.extract_uint8()
            
            if datum_index == DataIndexes.CATEGORY.value:
                data_extractor.extract_string()
            elif datum_index == DataIndexes.ALIVE.value:
                self.alive = data_extractor.extract_bool()
            elif datum_index == DataIndexes.RADAR_STATE.value:
                self.radar_state = data_extractor.extract_bool()
            elif datum_index == DataIndexes.HUMAN.value:
                self.human = data_extractor.extract_bool()
            elif datum_index == DataIndexes.CONTROLLED.value:
                self.controlled = data_extractor.extract_bool()
            elif datum_index == DataIndexes.COALITION.value:
                new_coalition = enum_to_coalition(data_extractor.extract_uint8())
                self.coalition = new_coalition
            elif datum_index == DataIndexes.COUNTRY.value:
                self.country = data_extractor.extract_uint8()
            elif datum_index == DataIndexes.NAME.value:
                self.name = data_extractor.extract_string()
            elif datum_index == DataIndexes.UNIT_NAME.value:
                self.unit_name = data_extractor.extract_string()
            elif datum_index == DataIndexes.CALLSIGN.value:
                self.callsign = data_extractor.extract_string()
            elif datum_index == DataIndexes.UNIT_ID.value:
                self.unit_id = data_extractor.extract_uint32()
            elif datum_index == DataIndexes.GROUP_ID.value:
                self.group_id = data_extractor.extract_uint32()
            elif datum_index == DataIndexes.GROUP_NAME.value:
                self.group_name = data_extractor.extract_string()
            elif datum_index == DataIndexes.STATE.value:
                self.state = states[data_extractor.extract_uint8()]
            elif datum_index == DataIndexes.TASK.value:
                self.task = data_extractor.extract_string()
            elif datum_index == DataIndexes.HAS_TASK.value:
                self.has_task = data_extractor.extract_bool()
            elif datum_index == DataIndexes.POSITION.value:
                self.position = data_extractor.extract_lat_lng()
            elif datum_index == DataIndexes.SPEED.value:
                self.speed = data_extractor.extract_float64()
            elif datum_index == DataIndexes.HORIZONTAL_VELOCITY.value:
                self.horizontal_velocity = data_extractor.extract_float64()
            elif datum_index == DataIndexes.VERTICAL_VELOCITY.value:
                self.vertical_velocity = data_extractor.extract_float64()
            elif datum_index == DataIndexes.HEADING.value:
                self.heading = data_extractor.extract_float64()
            elif datum_index == DataIndexes.TRACK.value:
                self.track = data_extractor.extract_float64()
            elif datum_index == DataIndexes.IS_ACTIVE_TANKER.value:
                self.is_active_tanker = data_extractor.extract_bool()
            elif datum_index == DataIndexes.IS_ACTIVE_AWACS.value:
                self.is_active_awacs = data_extractor.extract_bool()
            elif datum_index == DataIndexes.ON_OFF.value:
                self.on_off = data_extractor.extract_bool()
            elif datum_index == DataIndexes.FOLLOW_ROADS.value:
                self.follow_roads = data_extractor.extract_bool()
            elif datum_index == DataIndexes.FUEL.value:
                self.fuel = data_extractor.extract_uint16()
            elif datum_index == DataIndexes.DESIRED_SPEED.value:
                self.desired_speed = data_extractor.extract_float64()
            elif datum_index == DataIndexes.DESIRED_SPEED_TYPE.value:
                self.desired_speed_type = "GS" if data_extractor.extract_bool() else "CAS"
            elif datum_index == DataIndexes.DESIRED_ALTITUDE.value:
                self.desired_altitude = data_extractor.extract_float64()
            elif datum_index == DataIndexes.DESIRED_ALTITUDE_TYPE.value:
                self.desired_altitude_type = "AGL" if data_extractor.extract_bool() else "ASL"
            elif datum_index == DataIndexes.LEADER_ID.value:
                self.leader_id = data_extractor.extract_uint32()
            elif datum_index == DataIndexes.FORMATION_OFFSET.value:
                self.formation_offset = data_extractor.extract_offset()
            elif datum_index == DataIndexes.TARGET_ID.value:
                self.target_id = data_extractor.extract_uint32()
            elif datum_index == DataIndexes.TARGET_POSITION.value:
                self.target_position = data_extractor.extract_lat_lng()
            elif datum_index == DataIndexes.ROE.value:
                self.roe = ROES[data_extractor.extract_uint8()]
            elif datum_index == DataIndexes.ALARM_STATE.value:
                self.alarm_state = self.enum_to_alarm_state(data_extractor.extract_uint8())
            elif datum_index == DataIndexes.REACTION_TO_THREAT.value:
                self.reaction_to_threat = self.enum_to_reaction_to_threat(data_extractor.extract_uint8())
            elif datum_index == DataIndexes.EMISSIONS_COUNTERMEASURES.value:
                self.emissions_countermeasures = self.enum_to_emission_countermeasure(data_extractor.extract_uint8())
            elif datum_index == DataIndexes.TACAN.value:
                self.tacan = data_extractor.extract_tacan()
            elif datum_index == DataIndexes.RADIO.value:
                self.radio = data_extractor.extract_radio()
            elif datum_index == DataIndexes.GENERAL_SETTINGS.value:
                self.general_settings = data_extractor.extract_general_settings()
            elif datum_index == DataIndexes.AMMO.value:
                self.ammo = data_extractor.extract_ammo()
                self.previous_total_ammo = self.total_ammo
                self.total_ammo = sum(ammo.quantity for ammo in self.ammo)
            elif datum_index == DataIndexes.CONTACTS.value:
                self.contacts = data_extractor.extract_contacts()
            elif datum_index == DataIndexes.ACTIVE_PATH.value:
                self.active_path = data_extractor.extract_active_path()
            elif datum_index == DataIndexes.IS_LEADER.value:
                self.is_leader = data_extractor.extract_bool()
            elif datum_index == DataIndexes.OPERATE_AS.value:
                self.operate_as = self.enum_to_coalition(data_extractor.extract_uint8())
            elif datum_index == DataIndexes.SHOTS_SCATTER.value:
                self.shots_scatter = data_extractor.extract_uint8()
            elif datum_index == DataIndexes.SHOTS_INTENSITY.value:
                self.shots_intensity = data_extractor.extract_uint8()
            elif datum_index == DataIndexes.HEALTH.value:
                self.health = data_extractor.extract_uint8()
            elif datum_index == DataIndexes.RACETRACK_LENGTH.value:
                self.racetrack_length = data_extractor.extract_float64()
            elif datum_index == DataIndexes.RACETRACK_ANCHOR.value:
                self.racetrack_anchor = data_extractor.extract_lat_lng()
            elif datum_index == DataIndexes.RACETRACK_BEARING.value:
                self.racetrack_bearing = data_extractor.extract_float64()
            elif datum_index == DataIndexes.TIME_TO_NEXT_TASKING.value:
                self.time_to_next_tasking = data_extractor.extract_float64()
            elif datum_index == DataIndexes.BARREL_HEIGHT.value:
                self.barrel_height = data_extractor.extract_float64()
            elif datum_index == DataIndexes.MUZZLE_VELOCITY.value:
                self.muzzle_velocity = data_extractor.extract_float64()
            elif datum_index == DataIndexes.AIM_TIME.value:
                self.aim_time = data_extractor.extract_float64()
            elif datum_index == DataIndexes.SHOTS_TO_FIRE.value:
                self.shots_to_fire = data_extractor.extract_uint32()
            elif datum_index == DataIndexes.SHOTS_BASE_INTERVAL.value:
                self.shots_base_interval = data_extractor.extract_float64()
            elif datum_index == DataIndexes.SHOTS_BASE_SCATTER.value:
                self.shots_base_scatter = data_extractor.extract_float64()
            elif datum_index == DataIndexes.ENGAGEMENT_RANGE.value:
                self.engagement_range = data_extractor.extract_float64()
            elif datum_index == DataIndexes.TARGETING_RANGE.value:
                self.targeting_range = data_extractor.extract_float64()
            elif datum_index == DataIndexes.AIM_METHOD_RANGE.value:
                self.aim_method_range = data_extractor.extract_float64()
            elif datum_index == DataIndexes.ACQUISITION_RANGE.value:
                self.acquisition_range = data_extractor.extract_float64()
            elif datum_index == DataIndexes.AIRBORNE.value:
                self.airborne = data_extractor.extract_bool()
        
        