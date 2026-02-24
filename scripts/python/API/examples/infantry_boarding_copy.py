import asyncio
from asyncio import Semaphore
import json
from random import randrange
from api import API, Unit, UnitSpawnTable
from math import pi
import logging

#Set some globals up
alternate_time = 300
before_can_re_embark_time = 300
####Transport types#####
transport_ground = {
    "M-113": { 
        "max_capacity": 4,
        "max_embark_range": 50,
        "doors": 1,
        "door_positions": [(3.35,pi),(0,0)],
        "board_positions": [(15,pi),(0,0)],
        "door_argument_nos": None,
        "door_open_thresholds": None,
        "is_rear_loader": True,
        "boarding_distance": 5
      }
    }

transport_helicopters = {
    "UH-1H":{
        "max_capacity": 8,
        "max_embark_range": 100,
        "doors": 2,
        "door_positions": [(2.5,-pi/2),(0.8,0),(2.5,pi/2),(0.8,0)],  #two values here offset and heading offset in radians and second distance offset and heading offset in radians
        "board_positions": [(15,-pi/2),(0,0),(15,pi/2),(0,0)],
        "door_argument_nos": [43,44], #draw argument numbers for the doors
        "door_open_thresholds": [0.8,0.8], #value above which the door is considered open
        "is_rear_loader": False,
        "boarding_distance": 5
      }
    }

transport_types = set(transport_helicopters.keys()).union(transport_ground.keys())

#Infantry transport 
embarker_inf_red = {}
embarker_inf_blue = {"Soldier M4 GRG","soldier_wwii_us"}
embarker_types = embarker_inf_blue.union(embarker_inf_red)

#Time it takes after loading or unloading to swap back to the other

# Setup a logger for the module
logger = logging.getLogger("infantry_transport")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class Transporter(Unit):
    def __init__(self, Unit):
        self.unit = Unit
        
    def to_json(self):
        return {
            "is_transport": self.unit.is_transport,
            "max_capacity": self.unit.max_capacity,
            "current_capacity": self.unit.current_capacity,
            "max_embark_range": self.unit.max_embark_range,
            "boarding_distance": self.unit.boarding_distance,
            "current_cargo_weight": self.unit.current_cargo_weight,
            "unit_array": [unit.ID for unit in self.unit.unit_array],
            "en_boarding_queue": [unit.ID for unit in self.unit.en_boarding_queue],
            "doors": self.unit.doors,
            "door_positions": self.unit.door_positions,
            "board_positions": self.unit.board_positions,
            "door_argument_nos": self.unit.door_argument_nos,
            "door_open_thresholds": self.unit.door_open_thresholds,
            "is_rear_loader": self.unit.is_rear_loader,
            "will_disembark": self.unit.will_disembark
        }

    def set_as_transport(self):
        self.unit.is_transport = True
        if self.unit.name in transport_helicopters:
            if self.unit.name == "UH-1H":
                self.unit.max_capacity = transport_helicopters["UH-1H"]["max_capacity"]
                self.unit.max_embark_range = transport_helicopters["UH-1H"]["max_embark_range"]
                self.unit.boarding_distance = transport_helicopters["UH-1H"]["boarding_distance"]
                self.unit.current_capacity = 0
                self.unit.current_cargo_weight = 0
                self.unit.unit_array = []
                self.unit.en_boarding_queue = []
                self.unit.doors = transport_helicopters["UH-1H"]["doors"]
                self.unit.door_positions = transport_helicopters["UH-1H"]["door_positions"]
                self.unit.board_positions = transport_helicopters["UH-1H"]["board_positions"]

                self.unit.door_argument_nos = transport_helicopters["UH-1H"]["door_argument_nos"]
                self.unit.will_disembark = False
                self.unit.register_draw_argument(43) #Register draw argument 43 for UH-1H
                self.unit.register_draw_argument(44)
                self.unit.door_open_thresholds = transport_helicopters["UH-1H"]["door_open_thresholds"]
                self.unit.is_rear_loader = transport_helicopters["UH-1H"]["is_rear_loader"]
            else:
                self.unit.max_capacity = 8
                self.unit.max_embark_range = 100
                self.unit.boarding_distance = 5
                self.unit.current_capacity = 0
                self.unit.current_cargo_weight = 0
                self.unit.unit_array = []
                self.unit.en_boarding_queue = []
                self.unit.doors = 1
                self.unit.door_positions = [(5,pi),(0,0)]
                self.unit.board_positions = [(15,pi),(0,0)]
                self.unit.door_argument_nos = None
                self.unit.door_open_thresholds = None
                self.unit.will_disembark = False
                self.unit.is_rear_loader = True
            
        elif self.unit.name in transport_ground:
            if self.unit.name == "M-113":
                self.unit.max_capacity = transport_ground["M-113"]["max_capacity"]
                self.unit.max_embark_range = transport_ground["M-113"]["max_embark_range"]
                self.unit.boarding_distance = transport_ground["M-113"]["boarding_distance"]
                self.unit.current_capacity = 0
                self.unit.current_cargo_weight = 0
                self.unit.unit_array = []
                self.unit.en_boarding_queue = []
                self.unit.doors = transport_ground["M-113"]["doors"]
                self.unit.door_positions = transport_ground["M-113"]["door_positions"]
                self.unit.board_positions = transport_ground["M-113"]["board_positions"]
                self.unit.door_argument_nos = transport_ground["M-113"]["door_argument_nos"]
                self.unit.door_open_thresholds = transport_ground["M-113"]["door_open_thresholds"]
                self.unit.will_disembark = False
                self.unit.is_rear_loader = transport_ground["M-113"]["is_rear_loader"]
            else:
                self.unit.max_capacity = 4
                self.unit.max_embark_range = 50
                self.unit.boarding_distance = 5
                self.unit.current_capacity = 0
                self.unit.current_cargo_weight = 0
                self.unit.unit_array = []
                self.unit.en_boarding_queue = []
                self.unit.doors = 1
                self.unit.door_positions = [(5,pi),(0,0)]
                self.unit.board_positions = [(15,pi),(0,0)]
                self.unit.door_argument_nos = None
                self.unit.door_open_thresholds = None
                self.unit.will_disembark = False
                self.unit.is_rear_loader = True

        logger.info(f"Set unit '{self.unit.name}' as transport, with {self.unit.current_capacity} / {self.unit.max_capacity}.")

class DisembarkedInfantry(Unit):
    def __str__(self):
        return f"DisembarkedInfrantry(unit_id={self.unit_id}, group_id={self.group_id}, position={self.position}, heading={self.heading})"
    
    def __init__(self, Unit):
        self.unit = Unit
        
    def disembark_from_transport(self):
       destination = self.position.project_with_bearing_and_distance(30, self.heading)
       # Set the destination for the unit
       self.set_roe(4) #set to hold fire to avoid stopping to shoot
       self.is_loadable = False
       self.set_path([destination])
       if self.check_for_enemy_in_range():
           self.set_speed(10)
       else:
           self.set_speed(3)
       self.register_on_destination_reached_callback(
            self.on_destination_reached,
            destination,
            threshold=15.0, 
            timeout=30.0 # Timeout after 30 seconds if the destination is not reached
        )  
    
    def check_for_enemy_in_range(self):
        units = api.get_units()
        for unit in units.values():
            if unit.alive and unit.coalition != self.coalition:
                distance_to_enemy = self.position.distance_to(unit.position)
                if distance_to_enemy < 2000: #if an enemy is within 100m
                    return True
        return False
       
    async def on_destination_reached(self, _, reached: bool):
        if not reached:
            # logger.info(f"Unit {self} did not reach its destination.")
            self.set_roe(1)
            new_patrol = self.position.project_with_bearing_and_distance(1000, self.transport_spawn_heading)
            await asyncio.sleep(self.time_delay) #wait a bit before trying again
            self.set_path([new_patrol])
            if self.check_for_enemy_in_range():
                self.set_speed(10)
            else:
                self.set_speed(1.3)
            await asyncio.sleep(before_can_re_embark_time) #wait before setting to be boardable
            self.is_loadable = True
            logger.info(f"Unit {self} is now boardable again.")
        else:
            self.set_roe(1)
            logger.info(f"Unit {self} has reached its destination.")
            new_patrol = self.position.project_with_bearing_and_distance(1000, self.transport_spawn_heading)
            await asyncio.sleep(self.time_delay) #wait a bit before trying again
            self.set_path([new_patrol])
            if self.check_for_enemy_in_range():
                self.set_speed(10)
            else:
                self.set_speed(1.3)
            await asyncio.sleep(before_can_re_embark_time) #wait before setting to be boardable
            self.is_loadable = True
            logger.info(f"Unit {self} is now boardable again.")


class Embarker(Unit):
    def __str__(self):
        return f"DisembarkedInfrantry(unit_id={self.unit_id}, group_id={self.group_id}, position={self.position}, heading={self.heading})"
      
    def __init__(self, Unit):
        self.unit = Unit
        
    def to_json(self):
        return {
            "is_embarker": self.unit.is_embarker,
            "is_moving": self.unit.is_moving,
            "is_loadable": self.unit.is_loadable,
            "in_embark_queue": self.unit.in_embark_queue if hasattr(self.unit, 'in_embark_queue') else False,
            "transport_unit": self.unit.transport_unit.ID if hasattr(self.unit, 'transport_unit') and self.unit.transport_unit else None
        }
        
    def set_as_embarker(self):
        self.unit.is_embarker = True
        self.unit.is_moving = False
        self.unit.is_loadable = True
        logger.info(f"Set unit '{self.unit.name}' as embarker.")
        self.unit.set_custom_string("I am an embarker.")

    def can_board(self):
        transport = self.transport_unit
        if transport.current_capacity < transport.max_capacity:
            transport.unit_array.append(self.name)
            transport.current_capacity += 1
            self.delete_unit()
        else:
            pass
    
    def board_transport(self):
        door, num_doors_open = self.get_closest_door()
        if num_doors_open > 1: door_bypass = True
        else: door_bypass = False

        if door is None:
            pass
        elif door is not None:
            if self.is_moving:
                pass
            elif not self.is_moving:           
                distance_to_door = self.position.distance_to(door)
                distance_to_centre = self.position.distance_to(self.transport_unit.position)
                if distance_to_door < distance_to_centre:
                    bearing = self.position.bearing_to(door)
                    if hasattr(self,'nudge'):
                        nudge_factor = self.nudge
                    else:
                        nudge_factor = 0
                    destination = self.position.project_with_bearing_and_distance(distance_to_door+nudge_factor, bearing)
                    destination.threshold = 2
                    # Set the destination for the unit
                    self.set_path([destination])
                    self.register_on_destination_reached_callback(
                        self.on_destination_reached,
                        destination,
                        threshold=2.0,
                        timeout=10.0 # Timeout after 30 seconds if the destination is not reached
                    )
                    self.is_moving = True
                else:# distance_to_door >= distance_to_centre:
                    if self.transport_unit.is_rear_loader:
                        in_front_of_transport = self.transport_unit.position.project_with_bearing_and_distance(15, self.transport_unit.heading-pi)
                    else:
                        in_front_of_transport = self.transport_unit.position.project_with_bearing_and_distance(15, self.transport_unit.heading)
                    bearing = self.position.bearing_to(in_front_of_transport)
                    destination = self.position.project_with_bearing_and_distance(distance_to_door, bearing)
                    destination.threshold = 2
                    self.set_path([destination])
                    self.register_on_destination_reached_callback(
                        self.on_destination_reached,
                        destination,
                        threshold=2.0,
                        timeout=10.0
                    )
                    self.is_moving = True

    def get_closest_door(self):
        return check_closest_open_door(self.transport_unit, self)
        
    async def on_destination_reached(self, _, reached: bool):
        if not reached:
            logger.info(f"Unit {self} did not reach its destination.")
            self.is_moving = False
        else:
            logger.info(f"Unit {self} has reached its destination.")
            self.is_moving = False

        await asyncio.sleep(10)
        self.board_transport() # Attempt to board again

def check_closest_open_door(transport, embarker):
    if transport.name in transport_helicopters:
        if transport.door_argument_nos is None and transport.doors > 0:
            return transport.position.project_with_bearing_and_distance(5,transport.heading + pi), transport.heading + pi
        elif transport.door_argument_nos is not None and transport.doors > 0:
            closest_door = None
            doors_open = 0
            distance_to_closest_door = float('inf')
            for i in range(transport.doors):
                if transport.draw_arguments[i].value >= transport.door_open_thresholds[i]:
                     doors_open += 1
                     distance = embarker.position.distance_to(transport.position.project_with_bearing_and_distance(transport.door_positions[i*2][0], transport.heading + transport.door_positions[i*2][1]).project_with_bearing_and_distance(transport.door_positions[i*2+1][0], transport.heading + transport.door_positions[i*2+1][1]))
                     if distance < distance_to_closest_door:
                         distance_to_closest_door = distance
                         closest_door = transport.position.project_with_bearing_and_distance(transport.door_positions[i*2][0], transport.heading + transport.door_positions[i*2][1]).project_with_bearing_and_distance(transport.door_positions[i*2+1][0], transport.heading + transport.door_positions[i*2+1][1])
            return closest_door, doors_open
        else:
            return None, 0
    elif transport.name in transport_ground:
        if transport.door_argument_nos is None and transport.doors > 0:
            return transport.position.project_with_bearing_and_distance(2,transport.heading + pi), transport.heading + pi
        elif transport.door_argument_nos is not None and transport.doors > 0:
            closest_door = None
            doors_open = 0
            distance_to_closest_door = float('inf')
            for i in range(transport.doors):
                if transport.draw_arguments[i].value >= transport.door_open_thresholds[i]:
                     doors_open += 1
                     distance = embarker.position.distance_to(transport.position.project_with_bearing_and_distance(transport.door_positions[i*2][0], transport.heading + transport.door_positions[i*2][1]).project_with_bearing_and_distance(transport.door_positions[i*2+1][0], transport.heading + transport.door_positions[i*2+1][1]))
                     if distance < distance_to_closest_door:
                         distance_to_closest_door = distance
                         closest_door = transport.position.project_with_bearing_and_distance(transport.door_positions[i*2][0], transport.heading + transport.door_positions[i*2][1]).project_with_bearing_and_distance(transport.door_positions[i*2+1][0], transport.heading + transport.door_positions[i*2+1][1])
            return closest_door, doors_open
        else:
            return None, 0
           
def check_for_door_status(transporter):
    if transporter.name in transport_helicopters:
        if transporter.door_argument_nos is None and transporter.doors > 0:
            return True
        elif transporter.door_argument_nos is not None and transporter.doors > 0:
            a_door_is_open = False
            for i in range(transporter.doors):
               if transporter.draw_arguments[i].value >= transporter.door_open_thresholds[i]:
                   a_door_is_open = True
            return a_door_is_open
        else:
            return False
    elif transporter.name in transport_ground:
        if transporter.door_argument_nos is None and transporter.doors > 0:
            return True
        elif transporter.door_argument_nos is not None and transporter.doors > 0:
            a_door_is_open = False
            for i in range(transporter.doors):
                if transporter.draw_arguments[i].value >= transporter.door_open_thresholds[i]:
                    a_door_is_open = True
            return a_door_is_open
        else:
            return False

async def load_loadable_units():
    units = api.get_units()
    for embarker in units.values():
        if embarker.alive and hasattr(embarker, 'is_embarker'):
            if hasattr(embarker, 'in_embark_queue') and hasattr(embarker, 'transport_unit') and hasattr(embarker, 'is_moving'):                
                if embarker.transport_unit.name in transport_types:
                    #check the speed and distance, slow down if close
                    distance_to_transport = embarker.position.distance_to(embarker.transport_unit.position)
                    if distance_to_transport > 10 and embarker.speed < 1.4:
                        embarker.set_speed(10)
                    elif distance_to_transport < 10 and embarker.speed >= 3:
                        embarker.set_speed(2)
                    elif distance_to_transport < 5 and embarker.speed >= 1.3:
                        embarker.set_speed(1.3)
                    if embarker.roe != "hold":
                        embarker.set_roe(4) #set to hold fire to avoid stopping to shoot
                    #check the doors are open                    
                    if check_for_door_status(embarker.transport_unit):
                        closest_door, num_doors_open = check_closest_open_door(embarker.transport_unit, embarker)
                        if closest_door is not None:
                            #print(f"A door is open on {embarker.transport_unit.name}, closest door is {closest_door}, {num_doors_open} doors open")
                            embarker.__class__ = Embarker
                            #check if close enough to board
                            closest_door, _ = embarker.get_closest_door()   
                            door_distance = embarker.position.distance_to(closest_door)
                            if door_distance < embarker.transport_unit.boarding_distance:
                                transport = embarker.transport_unit
                                embarker_units = [
                                        (embarker, embarker.position.distance_to(transport.position))
                                        for embarker in units.values()
                                            if embarker.alive 
                                            and hasattr(embarker, 'is_embarker')
                                            and embarker.position.distance_to(transport.position) < transport.boarding_distance
                                    ]

                                embarkers_sorted = sorted(embarker_units, key=lambda x: x[1])
                                if not embarkers_sorted:
                                    pass
                                else:                                 
                                    if embarker.ID == embarkers_sorted[0][0].ID:
                                        transport.current_capacity += 1
                                        transport.unit_array.append(embarker)
                                        transport.set_cargo_weight(transport.current_cargo_weight + 100) #assume 100kg per infantry with kit
                                        transport.current_cargo_weight += 100
                                        embarker.delete_unit()
                                        asyncio.create_task(set_as_disembarking(transport))
                                        break
                            #else run it closer
                            if embarker.is_moving:
                                if hasattr(embarker, 'last_pos'):
                                    if embarker.position == embarker.last_pos:
                                        embarker.is_moving = False
                                        embarker.set_speed(1.3)
                                        if hasattr(embarker, 'nudge'):
                                            embarker.nudge = embarker.nudge + 2
                                        else:
                                            embarker.nudge = 2   
                                embarker.last_pos = embarker.position
                                pass
                            elif not embarker.is_moving:                    
                                embarker.board_transport()
                    else:
                        #no doors so do nothing
                        pass

def generate_transport_units():
    units = api.get_units()
    for unit in units.values():
        if unit.alive and unit.name in transport_types and not hasattr(unit, 'is_transport'):
            new_transport = Transporter(unit)
            new_transport.set_as_transport()

        elif unit.alive and unit.name in embarker_types and not hasattr(unit, 'is_embarker'):
            new_emabarquee = Embarker(unit)
            new_emabarquee.set_as_embarker()

async def set_as_disembarking(transport):
    await asyncio.sleep(alternate_time)
    transport.will_disembark = True

async def set_as_not_disembarking(transport):
    await asyncio.sleep(alternate_time)
    transport.will_disembark = False

unload_semaphore = Semaphore(1)

async def check_for_unloadable_units():
    # Use the semaphore to ensure only one instance runs at a time
    async with unload_semaphore:
        units = api.get_units()
        try:
            for transporter in units.values():
                if transporter.alive and hasattr(transporter, 'is_transport') and transporter.will_disembark:
                    # Check if the transporter is in a position to disembark units
                    if transporter.speed < 2 and check_for_door_status(transporter) and not transporter.airborne:  # check speed is less than 2 m/s and doors are open
                        first_two_spawns = True  # Track if we are handling the first two spawns
                        to_remove = [] #sets up variable to hold units to remove from queue
                        for disembarker in transporter.unit_array:
                            # Get the open doors
                            open_doors = []
                            open_doors_headings = []
                            for i in range(transporter.doors):
                                if transporter.draw_arguments[i].value >= transporter.door_open_thresholds[i]:
                                    door_position = transporter.position.project_with_bearing_and_distance(
                                        transporter.door_positions[i * 2][0],
                                        transporter.heading + transporter.door_positions[i * 2][1]
                                    ).project_with_bearing_and_distance(
                                        transporter.door_positions[i * 2 + 1][0],
                                        transporter.heading + transporter.door_positions[i * 2 + 1][1]
                                    )
                                    door_heading = transporter.heading + transporter.door_positions[i * 2][1]
                                    open_doors.append(door_position)
                                    open_doors_headings.append(door_heading)

                            # Round-robin spawn mechanism
                            if not hasattr(transporter, 'last_door_index'):
                                transporter.last_door_index = 0  # Initialize the last used door index

                            # Get the next door in the round-robin sequence
                            door_index = transporter.last_door_index % len(open_doors)
                            transporter.last_door_index += 1  # Increment the door index for the next spawn

                            # Spawn the unit at the selected door
                            door_position = open_doors[door_index]
                            door_heading = open_doors_headings[door_index]

                            spawn_table: UnitSpawnTable = UnitSpawnTable(
                                unit_type=disembarker.name,
                                location=door_position,
                                heading=door_heading,
                                skill="High",
                                livery_id=""
                            )

                            async def execution_callback(new_group_ID: int):
                                logger.info(f"New units spawned, groupID: {new_group_ID}")
                                units = api.get_units()
                                for new_unit in units.values():
                                    if new_unit.group_id == new_group_ID:
                                        logger.info(f"New unit spawned: {new_unit}")
                                        new_unit.__class__ = DisembarkedInfantry
                                        new_unit.transport_spawn_heading = transporter.heading
                                        new_unit.disembark_from_transport()
                                        new_unit.original_position = new_unit.position
                                        #the delay is a function of how many units are left to disembark and how long it takes to get to the disembark spot
                                        new_unit.time_delay = transporter.max_capacity*2 - transporter.current_capacity  # Random delay between 10 and 30 seconds

                            api.spawn_ground_units([spawn_table], transporter.coalition, "", True, 0, execution_callback)
                            to_remove.append(disembarker)
                            transporter.en_boarding_queue = []
                            transporter.current_capacity -= 1
                            transporter.set_cargo_weight(transporter.current_cargo_weight - 100)  # Assume 100kg per infantry with kit
                            transporter.current_cargo_weight -= 100

                            # Add a delay between spawns
                            if len(open_doors) > 1 and first_two_spawns:
                                # Shorter delay for the first two spawns if both doors are open
                                await asyncio.sleep(0.5)
                                first_two_spawns = False
                            else:
                                # Normal delay for subsequent spawns or single-door spawns
                                await asyncio.sleep(2.5)
                        for disembarker in to_remove:
                            transporter.unit_array.remove(disembarker)
                        if transporter.current_capacity == 0:
                            await set_as_not_disembarking(transporter)

                        logger.info(f"Spawned unit '{disembarker.name}' from open door of transport '{transporter.name}'.")
        except Exception as e:
            logger.error(f"Error in check_for_unloadable_units: {e}")

def check_for_loadable_units():
    units = api.get_units()
    for transporter in units.values():        
        if transporter.alive and hasattr(transporter, 'is_transport') and not transporter.will_disembark:
            if len(transporter.unit_array) < transporter.max_capacity:    
                if transporter.speed < 2 and check_for_door_status(transporter):  #check speed is less than 2 m/s and doors are open        
                # print("Speed is okay")
                    embarker_units = [
                        (embarker, embarker.position.distance_to(transporter.position))
                        for embarker in units.values()
                            if embarker.alive 
                            and hasattr(embarker, 'is_embarker')
                            and getattr(embarker, 'is_loadable', True)  # Check if is_loadable is True
                            and embarker.position.distance_to(transporter.position) < transporter.max_embark_range
                    ]
                    if embarker_units is None or len(embarker_units) == 0:
                        continue
                    else:
                        for embarker in embarker_units:
                            if hasattr(embarker, 'in_embark_queue') and embarker.in_embark_queue:
                                if embarker.in_embark_queue:                               
                                        embarker_units.remove(embarker)

                        embarkers_sorted = sorted(embarker_units, key=lambda x: x[1])
                        closest_embarkers = embarkers_sorted[:transporter.max_capacity-len(transporter.en_boarding_queue)]

                        for embarker, distance in closest_embarkers:                       
                            if embarker not in transporter.en_boarding_queue and distance < transporter.max_embark_range:
                                transporter.en_boarding_queue.append(embarker)
                                embarker.in_embark_queue = True
                                embarker.transport_unit = transporter
                                logger.info(f"Added embarker '{embarker.name}' to '{transporter.name}' s boarding queue.")
                            elif embarker in transporter.en_boarding_queue:
                                pass
            else:
                pass #we pass as the transport is full


#############
#API SECTION#
#############
def on_api_startup(api: API):
    global units_to_delete
    logger.info("API started")
    
    # Get all the units from the API. Force an update to get the latest units.
    units = api.update_units()
    
    # Initialize the list to hold units to delete
    units_to_delete = []

def on_unit_alive_change(unit: Unit, value: bool):
    global units_to_delete
    
    if units_to_delete is None:
        logger.error("units_to_delete is not initialized.")
        return
    
    # Check if the unit has been deleted
    if value is False:
        if unit in units_to_delete:
            units_to_delete.remove(unit)
        else:
            pass

async def update_data():
    units = api.get_units()
    for unit in units.values():
        if unit.alive and hasattr(unit, 'is_transport'):   
            stringified_json = json.dumps(Transporter(unit).to_json())
            unit.set_custom_string(stringified_json)
        elif unit.alive and hasattr(unit, 'is_embarker'):
            stringified_json = json.dumps(Embarker(unit).to_json())
            unit.set_custom_string(stringified_json)
    await asyncio.sleep(1)

async def on_api_update(api: API):
    generate_transport_units()
    check_for_loadable_units()
    asyncio.create_task(load_loadable_units())
    asyncio.create_task(check_for_unloadable_units())
    asyncio.create_task(update_data())
    
if __name__ == "__main__":
    api = API()
    api.register_on_update_callback(on_api_update)
    api.register_on_startup_callback(on_api_startup)
    api.run()