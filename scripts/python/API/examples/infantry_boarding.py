import asyncio
from asyncio import Semaphore
from random import randrange
from api import API, Unit, UnitSpawnTable
from math import pi
import logging
import time

#Set some globals up
before_can_re_embark_time = 300 # this is the time it takes for the infantry, after disembarking, to become embarkable again
min_toggle_time_period = 30 # this should typically be however long it takes the longest thing to load or unload, used to prevent accidental re toggling the toggle switch too early by accident
####Transport types#####
transport_ground = {}

transport_helicopters = {
    "UH-1H":{
        "max_capacity": 8,
        "max_embark_range": 100,
        "doors": 2,
        "door_positions": [(2.5,-pi/2),(0.8,0),(2.5,pi/2),(0.8,0)],  #two values here offset and heading offset in radians and second distance offset and heading offset in radians
        "centre_offset_position": [(0,0),(0,0)],  #used for calculating the unit door centre, when the doors aren't in line with the centre
        "door_argument_nos": [43,44], #draw argument numbers for the doors
        "door_open_thresholds": [0.8,0.8], #value above which the door is considered open
        "is_rear_loader": False,
        "boarding_distance": 5,
        "rotor_radius": 15
      },
      "CH-47Fbl1":{
            "max_capacity": 30,
            "max_embark_range": 100,
            "doors": 1,
            "door_positions": [(12,-pi),(0,0)],  #two values here offset and heading offset in radians and second distance offset and heading offset in radians
            "centre_offset_position": [(11,-pi),(0,0)],  #used for calculating the unit door centre, when the doors aren't in line with the centre
            "door_argument_nos": [86], #draw argument numbers for the doors
            "door_open_thresholds": [0.55], #value above which the door is considered open
            "is_rear_loader": True,
            "boarding_distance": 10,
             "rotor_radius": 31
      },
      "Mi-8MT":{
            "max_capacity": 24,
            "max_embark_range": 100,
            "doors": 1,
            "door_positions": [(6,-pi),(0,0)],  #two values here offset and heading offset in radians and second distance offset and heading offset in radians
            "centre_offset_position": [(5.5,-pi),(0,0)],  #used for calculating the unit door centre, when the doors aren't in line with the centre
            "door_argument_nos": [86], #draw argument numbers for the doors
            "door_open_thresholds": [0.8], #value above which the door is considered open
            "is_rear_loader": True,
            "boarding_distance": 10,
            "rotor_radius": 22
      },
      "Mi-24P":{           
            "max_capacity": 8,
            "max_embark_range": 100,
            "doors": 2,
            "door_positions": [(2.5,+pi/2),(1.2,0),(2.5,-pi/2),(1.2,0)],  #two values here offset and heading offset in radians and second distance offset and heading offset in radians
            "centre_offset_position": [(0,0),(0,0)],  #used for calculating the unit door centre, when the doors aren't in line with the centre
            "door_argument_nos": [38,86], #draw argument numbers for the doors
            "door_open_thresholds": [0.8,0.8], #value above which the door is considered open
            "is_rear_loader": False,
            "boarding_distance": 5,
            "rotor_radius": 18
      }
}

transport_types = set(transport_helicopters.keys()).union(transport_ground.keys())

#Infantry transport 
embarker_inf_red = {}
embarker_inf_blue = {"Soldier M4 GRG","soldier_wwii_us"}
embarker_types = embarker_inf_blue.union(embarker_inf_red)

#Time it takes after loading or unloading to swap back to the other

# Setup a logger for the module
logger = logging.getLogger("infantry_boarding")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

def cross_product_2d(v1, v2):
    return v1[0] * v2[1] - v1[1] * v2[0]

def determine_side(self, door):
    # Calculate relative vectors
    vector_to_unit = [
        self.position.lat - self.transport_unit.position.lat,
        self.position.lng - self.transport_unit.position.lng
    ]
    vector_to_door = [
        door.lat - self.transport_unit.position.lat,
        door.lng - self.transport_unit.position.lng
    ]

    # Compute the 2D cross product
    cross_z = cross_product_2d(vector_to_unit, vector_to_door)

    # Determine the side based on the sign of the cross product
    if cross_z > 0:
        return True
    elif cross_z < 0:
       return False
    else:
        return True

class Transporter(Unit):
    def __init__(self, Unit):
        self.unit = Unit

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
                self.unit.current_max_capacity = 0
                self.unit.doors = transport_helicopters["UH-1H"]["doors"]
                self.unit.door_positions = transport_helicopters["UH-1H"]["door_positions"]
                self.unit.centre_offset_position = transport_helicopters["UH-1H"]["centre_offset_position"]
                self.unit.door_argument_nos = transport_helicopters["UH-1H"]["door_argument_nos"]
                self.unit.door_open_thresholds = transport_helicopters["UH-1H"]["door_open_thresholds"]
                self.unit.will_disembark = True
                self.unit.register_draw_argument(43) #left door
                self.unit.register_draw_argument(44) #right door
                self.unit.register_draw_argument(446) #interior light colour switch, we use as a toggle
                self.unit.loading_toggle_argument = 2 #this is the argument registered in the index on the draw arguments that controls loading state, have to trial and error what it is for each transport type
                self.unit.disembark_embark_argument_toggle_argument_threshold = 0.7
                self.unit.is_rear_loader = transport_helicopters["UH-1H"]["is_rear_loader"]
                self.unit.rotor_radius = transport_helicopters["UH-1H"]["rotor_radius"]
            elif self.unit.name == "CH-47Fbl1":
                self.unit.max_capacity = transport_helicopters["CH-47Fbl1"]["max_capacity"]
                self.unit.max_embark_range = transport_helicopters["CH-47Fbl1"]["max_embark_range"]
                self.unit.boarding_distance = transport_helicopters["CH-47Fbl1"]["boarding_distance"]
                self.unit.current_capacity = 0
                self.unit.current_cargo_weight = 0
                self.unit.unit_array = []
                self.unit.en_boarding_queue = []
                self.unit.current_max_capacity = 0
                self.unit.doors = transport_helicopters["CH-47Fbl1"]["doors"]
                self.unit.centre_offset_position = transport_helicopters["CH-47Fbl1"]["centre_offset_position"]
                self.unit.door_positions = transport_helicopters["CH-47Fbl1"]["door_positions"]
                self.unit.door_argument_nos = transport_helicopters["CH-47Fbl1"]["door_argument_nos"]
                self.unit.door_open_thresholds = transport_helicopters["CH-47Fbl1"]["door_open_thresholds"]
                self.unit.will_disembark = True
                self.unit.register_draw_argument(86) #rear ramp
                self.unit.register_draw_argument(606) #interior light colour switch, we use as a toggle
                self.unit.loading_toggle_argument = 1 #this is the argument registered in the index on the draw arguments that controls loading state, have to trial and error what it is for each transport type
                self.unit.disembark_embark_argument_toggle_argument_threshold = 0.5
                self.unit.is_rear_loader = transport_helicopters["CH-47Fbl1"]["is_rear_loader"]
                self.unit.rotor_radius = transport_helicopters["CH-47Fbl1"]["rotor_radius"]
            elif self.unit.name == "Mi-8MT":
                self.unit.max_capacity = transport_helicopters["Mi-8MT"]["max_capacity"]
                self.unit.max_embark_range = transport_helicopters["Mi-8MT"]["max_embark_range"]
                self.unit.boarding_distance = transport_helicopters["Mi-8MT"]["boarding_distance"]
                self.unit.current_capacity = 0
                self.unit.current_cargo_weight = 0
                self.unit.unit_array = []
                self.unit.en_boarding_queue = []
                self.unit.current_max_capacity = 0
                self.unit.doors = transport_helicopters["Mi-8MT"]["doors"]
                self.unit.centre_offset_position = transport_helicopters["Mi-8MT"]["centre_offset_position"]
                self.unit.door_positions = transport_helicopters["Mi-8MT"]["door_positions"]
                self.unit.door_argument_nos = transport_helicopters["Mi-8MT"]["door_argument_nos"]
                self.unit.door_open_thresholds = transport_helicopters["Mi-8MT"]["door_open_thresholds"]
                self.unit.will_disembark = True
                self.unit.register_draw_argument(86) #rear ramp
                self.unit.register_draw_argument(133) #interior light colour switch, we use as a toggle
                self.unit.loading_toggle_argument = 1 #this is the argument registered in the index on the draw arguments that controls loading state, have to trial and error what it is for each transport type
                self.unit.disembark_embark_argument_toggle_argument_threshold = 0.8
                self.unit.is_rear_loader = transport_helicopters["Mi-8MT"]["is_rear_loader"]
                self.unit.rotor_radius = transport_helicopters["Mi-8MT"]["rotor_radius"]
            elif self.unit.name == "Mi-24P":
                self.unit.max_capacity = transport_helicopters["Mi-24P"]["max_capacity"]
                self.unit.max_embark_range = transport_helicopters["Mi-24P"]["max_embark_range"]
                self.unit.boarding_distance = transport_helicopters["Mi-24P"]["boarding_distance"]
                self.unit.current_capacity = 0
                self.unit.current_cargo_weight = 0
                self.unit.unit_array = []
                self.unit.en_boarding_queue = []
                self.unit.current_max_capacity = 0
                self.unit.doors = transport_helicopters["Mi-24P"]["doors"]
                self.unit.centre_offset_position = transport_helicopters["Mi-24P"]["centre_offset_position"]
                self.unit.door_positions = transport_helicopters["Mi-24P"]["door_positions"]
                self.unit.door_argument_nos = transport_helicopters["Mi-24P"]["door_argument_nos"]
                self.unit.door_open_thresholds = transport_helicopters["Mi-24P"]["door_open_thresholds"]
                self.unit.will_disembark = True
                self.unit.register_draw_argument(38) #left door
                self.unit.register_draw_argument(86) #right door
                self.unit.register_draw_argument(47) #interior light colour switch, we use as a toggle
                self.unit.loading_toggle_argument = 2 #this is the argument registered in the index on the draw arguments that controls loading state, have to trial and error what it is for each transport type
                self.unit.disembark_embark_argument_toggle_argument_threshold = 0.8
                self.unit.is_rear_loader = transport_helicopters["Mi-24P"]["is_rear_loader"]
                self.unit.rotor_radius = transport_helicopters["Mi-24P"]["rotor_radius"]
            else:
                pass

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
           self.set_speed(2)
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
                if distance_to_enemy < 2000: #if an enemy is within 2000m, approx rifle max range
                    return True
        return False
       
    async def on_destination_reached(self, _, reached: bool):
        if not reached:
            # logger.info(f"Unit {self} did not reach its destination.")
            self.set_roe(1)
            new_patrol = self.position.project_with_bearing_and_distance(1000, self.transport_spawn_heading)
            await asyncio.sleep(10) #wait a bit before trying again
            try:
                if self.og_transport.is_rear_loader:
                    side_offset = self.position.project_with_bearing_and_distance(30,self.transport_spawn_heading-pi/2)
                    self.set_path([side_offset,new_patrol])
                else:
                    self.set_path([new_patrol])
            except AttributeError:
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
            new_patrol = self.position.project_with_bearing_and_distance(1000, self.transport_spawn_heading)
            await asyncio.sleep(10) #wait a bit before trying again
            try:
                if self.og_transport.is_rear_loader:
                    side_offset = self.position.project_with_bearing_and_distance(30,self.transport_spawn_heading-pi/2)
                    self.set_path([side_offset,new_patrol])
                else:
                    self.set_path([new_patrol])
            except AttributeError:
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
        
    def set_as_embarker(self):
        self.unit.is_embarker = True
        self.unit.is_moving = False
        self.unit.is_loadable = True
        logger.info(f"Set unit '{self.unit.name}' as embarker.")

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
        if num_doors_open > 1:
            door_bypass = True
        else:
            door_bypass = False

        if door is None:
            pass
        elif door is not None:
            if self.is_moving:
                pass
            elif not self.is_moving:
                distance = self.position.distance_to(door)     
                distance_centre_offset_position = self.position.distance_to(self.transport_unit.position.project_with_bearing_and_distance(self.transport_unit.centre_offset_position[0][0], self.transport_unit.centre_offset_position[0][1]))

                if distance >= distance_centre_offset_position:                 
                    if determine_side(self,door): #right side
                        if self.transport_unit.is_rear_loader:    # chinook rear loader                      
                            destination = door.project_with_bearing_and_distance(self.transport_unit.rotor_radius/3, self.transport_unit.heading-pi)
                            destination = destination.project_with_bearing_and_distance(self.transport_unit.rotor_radius/2, self.transport_unit.heading+pi/2)
                            destination.threshold = 2
                            self.set_path([destination])
                            self.register_on_destination_reached_callback(
                                self.on_destination_reached,
                                destination,
                                threshold=2.0,
                                timeout=10.0 # Timeout after 30 seconds if the destination is not reached
                            )
                            self.is_moving = True
                        else: # huey front loader
                            destination = door.project_with_bearing_and_distance(self.transport_unit.rotor_radius, self.transport_unit.heading)
                            destination = destination.project_with_bearing_and_distance(self.transport_unit.rotor_radius/2, self.transport_unit.heading+pi/2)
                            destination.threshold = 2
                            self.set_path([destination])
                            self.register_on_destination_reached_callback(
                                self.on_destination_reached,
                                destination,
                                threshold=2.0,
                                timeout=10.0 # Timeout after 30 seconds if the destination is not reached
                            )
                            self.is_moving = True
                    else: #left side
                        if self.transport_unit.is_rear_loader:    # chinook rear loader                      
                            destination = door.project_with_bearing_and_distance(self.transport_unit.rotor_radius/3, self.transport_unit.heading-pi)
                            destination = destination.project_with_bearing_and_distance(self.transport_unit.rotor_radius/2, self.transport_unit.heading-pi/2)
                            destination.threshold = 2
                            self.set_path([destination])
                            self.register_on_destination_reached_callback(
                                self.on_destination_reached,
                                destination,
                                threshold=2.0,
                                timeout=10.0 # Timeout after 30 seconds if the destination is not reached
                            )
                            self.is_moving = True
                        else: # huey front loader
                            destination = door.project_with_bearing_and_distance(self.transport_unit.rotor_radius, self.transport_unit.heading)
                            destination = destination.project_with_bearing_and_distance(self.transport_unit.rotor_radius/2, self.transport_unit.heading-pi/2)
                            destination.threshold = 2
                            self.set_path([destination])
                            self.register_on_destination_reached_callback(
                                self.on_destination_reached,
                                destination,
                                threshold=2.0,
                                timeout=10.0 # Timeout after 30 seconds if the destination is not reached
                            )
                            self.is_moving = True
                else: 
                    destination = self.position.project_with_bearing_and_distance(distance+2, self.position.bearing_to(door))
                    #destination = destination.project_with_bearing_and_distance(self.transport_unit.rotor_radius, self.transport_unit.heading+pi/2)
                    destination.threshold = 2
                    self.set_path([destination,door])
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

def check_for_door_status(transporter):
    if not hasattr(transporter, 'draw_arguments') or len(transporter.draw_arguments) < transporter.doors:
        #logger.warning(f"Transporter '{transporter.name}' does not have enough draw arguments registered.")
        return False

    if transporter.name in transport_helicopters:
        if transporter.door_argument_nos is None and transporter.doors > 0:
            return True
        elif transporter.door_argument_nos is not None and transporter.doors > 0:
            a_door_is_open = False
            for i in range(transporter.doors):
                if i >= len(transporter.draw_arguments):  # Ensure the index is valid
                    #logger.error(f"Index {i} out of range for draw_arguments in transporter '{transporter.name}'.")
                    continue
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
                if i >= len(transporter.draw_arguments):  # Ensure the index is valid
                    #logger.error(f"Index {i} out of range for draw_arguments in transporter '{transporter.name}'.")
                    continue
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
                            if door_distance < embarker.transport_unit.boarding_distance or embarker.position.distance_to(embarker.transport_unit.position) < embarker.transport_unit.boarding_distance:
                                transport = embarker.transport_unit
                                embarker_units = [
                                        (embarker, embarker.position.distance_to(transport.position))
                                        for embarker in units.values()
                                            if embarker.alive 
                                            and hasattr(embarker, 'is_embarker')
                                            and embarker.position.distance_to(closest_door) < transport.boarding_distance
                                    ]

                                embarkers_sorted = sorted(embarker_units, key=lambda x: x[1])
                                if not embarkers_sorted:
                                    pass
                                else:                                 
                                    if embarker.ID == embarkers_sorted[0][0].ID:
                                        transport.current_capacity += 1
                                        transport.current_max_capacity +=1
                                        transport.unit_array.append(embarker)
                                        transport.set_cargo_weight(transport.current_cargo_weight + 100) #assume 100kg per infantry with kit
                                        transport.current_cargo_weight += 100
                                        embarker.delete_unit()
                                        #asyncio.create_task(set_as_disembarking(transport))
                                        break
                            #else run it closer
                            if embarker.is_moving:
                                if hasattr(embarker, 'last_pos'):
                                    if embarker.position == embarker.last_pos:
                                        embarker.is_moving = False        
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
    transport.will_disembark = True
    transport.en_boarding_queue = []            

async def set_as_not_disembarking(transport):
    transport.will_disembark = False
    transport.current_max_capacity = transport.current_capacity

unload_semaphore = Semaphore(1)

async def check_for_unloadable_units():
    # Use the semaphore to ensure only one instance runs at a time
    async with unload_semaphore:
        units = api.get_units()
        try:
            for transporter in units.values():
                if transporter.alive and hasattr(transporter, 'is_transport') and transporter.will_disembark:
                    # Check if the transporter is in a position to disembark units
                    if transporter.speed < 2 and check_for_door_status(transporter) and not transporter.airborne and transporter.current_capacity > 0:  # check speed is less than 2 m/s and doors are open
                        # Transport is ready to disembark
                        to_remove = []  # Sets up variable to hold units to remove from queue
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


                            async def execution_callback(new_group_ID: int):
                                logger.info(f"New units spawned, groupID: {new_group_ID}")
                                units = api.get_units()
                                for new_unit in units.values():
                                    if new_unit.group_id == new_group_ID:
                                        logger.info(f"New unit spawned: {new_unit}")
                                        new_unit.__class__ = DisembarkedInfantry
                                        new_unit.transport_spawn_heading = transporter.heading
                                        new_unit.og_transport = transporter
                                        new_unit.disembark_from_transport()
                                        new_unit.original_position = new_unit.position
                                        # The delay is a function of how many units are left to disembark and how long it takes to get to the disembark spot

                            async def delayed_spawn(delay,transporter,open_doors,open_doors_headings,disembarker):
                                door_index = transporter.last_door_index % len(open_doors)
                                transporter.last_door_index += 1
                                # Increment the door index for the next spawn

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
                                # Add a delay before spawning the unit                                
                                await asyncio.sleep(delay)  # Delay of 2 seconds (adjust as needed)
                                api.spawn_ground_units([spawn_table], transporter.coalition, "", True, 0, execution_callback)                                

                                transporter.set_cargo_weight(transporter.current_cargo_weight - 100)  # Assume 100kg per infantry with kit
                                transporter.current_cargo_weight -= 100
                                logger.info(f"Spawned unit '{disembarker.name}' from open door of transport '{transporter.name}'.")

                            if len(open_doors) > 1:                                
                                if (transporter.current_max_capacity - transporter.current_capacity) < len(open_doors):
                                    delay = 0.1
                                else:
                                    delay = (transporter.current_max_capacity - transporter.current_capacity) * 1.25 - ((len(open_doors)-1) * 2.5) + 2.5
                            else:
                                 delay = (transporter.current_max_capacity - transporter.current_capacity) * 2.5  
                            asyncio.create_task(delayed_spawn(delay,transporter,open_doors,open_doors_headings,disembarker))
                            
                            transporter.en_boarding_queue = []                            
                            transporter.current_capacity -= 1
                            to_remove.append(disembarker)                            

                        for disembarker in to_remove:
                            transporter.unit_array.remove(disembarker)
                        
        except Exception as e:
            #logging.warning(e, exc_info=True)
            logger.info(f"Error in check_for_unloadable_units: {e}")

async def check_for_loadable_units():
    units = api.get_units()
    try:
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
                                if embarker not in transporter.en_boarding_queue and distance < transporter.max_embark_range and not hasattr(embarker, 'is_in_queue'):
                                    transporter.en_boarding_queue.append(embarker)
                                    embarker.in_embark_queue = True
                                    embarker.is_in_queue = True
                                    embarker.transport_unit = transporter
                                    logger.info(f"Added embarker '{embarker.name}' to '{transporter.name}' s boarding queue.")
                                elif embarker not in transporter.en_boarding_queue and distance < transporter.max_embark_range and hasattr(embarker, 'is_in_queue'):
                                    if embarker.is_in_queue:
                                        await asyncio.sleep(60) #wait a bit and try again next time
                                        embarker.is_in_queue = False
                                    else:
                                        transporter.en_boarding_queue.append(embarker)
                                        embarker.in_embark_queue = True
                                        embarker.is_in_queue = True
                                        embarker.transport_unit = transporter
                                        logger.info(f"Added embarker '{embarker.name}' to '{transporter.name}' s boarding queue.") 
                                elif embarker in transporter.en_boarding_queue:
                                    pass
                                
                else:
                    pass #we pass as the transport is full
    except Exception as e:
        logger.error(f"Error in check_for_loadable_units: {e}")       

async def check_for_transport_embarker_or_disembark():
    units = api.get_units()
    try:
        for transporter in units.values():
            if transporter.alive and hasattr(transporter, 'is_transport'):
                # Ensure the transporter has a `last_toggle_time` attribute
                if not hasattr(transporter, 'last_toggle_time'):
                    transporter.last_toggle_time = 0  # Initialize it to 0

                # Get the current time
                current_time = time.time()

                # Check if the toggle is allowed (min_toggle_time_period seconds since the last toggle)
                if current_time - transporter.last_toggle_time < min_toggle_time_period:
                    continue  # Skip toggling if the cooldown hasn't passed

                # Check the loading toggle argument and toggle the state
                if transporter.loading_toggle_argument is None or not hasattr(transporter, 'draw_arguments') or len(transporter.draw_arguments) <= transporter.loading_toggle_argument:
                    pass
                else:
                    if transporter.will_disembark:
                        if transporter.draw_arguments[transporter.loading_toggle_argument].value <= transporter.disembark_embark_argument_toggle_argument_threshold:
                            continue
                        elif transporter.draw_arguments[transporter.loading_toggle_argument].value > transporter.disembark_embark_argument_toggle_argument_threshold:
                            # Set to embark
                            await set_as_not_disembarking(transporter)
                            transporter.last_toggle_time = current_time  # Update the last toggle time
                            logger.info(f"Transporter '{transporter.name}' set to embark.")
                    else:
                        if transporter.draw_arguments[transporter.loading_toggle_argument].value <= transporter.disembark_embark_argument_toggle_argument_threshold:
                            # Set to disembark
                            await set_as_disembarking(transporter)
                            transporter.last_toggle_time = current_time  # Update the last toggle time
                            logger.info(f"Transporter '{transporter.name}' set to disembark.")
                        elif transporter.draw_arguments[transporter.loading_toggle_argument].value > transporter.disembark_embark_argument_toggle_argument_threshold:
                            continue

    except Exception as e:
        logger.error(f"Error in check_for_transport_embarker_or_disembark: {e}")

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
    generate_transport_units() #comment this if doing draw Args testing
    #new_test_unit() # comment this if running normally, this is used only for getting draw args

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

# unit_args = []
# exclusions_array = [1,102,103,11,12,17,278,279,280,281,282,283,284,286,287,288,289,290,337,37,39,393,399,4,40,41,42,448,487,488,6,77,99]
# async def check_args_changed():
#     global unit_args
#     units = api.get_units()
#     for unit in units.values():
#         for argument in unit.draw_arguments:
#             if argument in unit_args:
#                 pass
#             else:
#                 if argument.argument in exclusions_array:
#                     pass
#                 else:
#                   print(argument.argument, end=",")
#     unit_args = unit.draw_arguments
#     print("New loop")

# def new_test_unit():
#     units = api.get_units()
#     for unit in units.values():
#         if unit.alive and unit.name in transport_types and not hasattr(unit, 'is_transport'):
#             for i in range(500): #191
#                 unit.register_draw_argument(i)

# def check_arg_value():
#     units = api.get_units()
#     for unit in units.values():
#         if unit.alive and unit.name in transport_types:
#             unit.register_draw_argument(47) #191
#             print(f"{unit.draw_arguments[0].argument} value is {unit.draw_arguments[0].value}")

async def on_api_update(api: API):
    asyncio.create_task(check_for_loadable_units())
    asyncio.create_task(load_loadable_units())
    asyncio.create_task(check_for_unloadable_units())
    asyncio.create_task(check_for_transport_embarker_or_disembark())
    generate_transport_units()
    #asyncio.create_task(check_args_changed())
    #check_arg_value()



if __name__ == "__main__":
    api = API()
    api.register_on_startup_callback(on_api_startup)
    api.register_on_update_callback(on_api_update)
    api.run()