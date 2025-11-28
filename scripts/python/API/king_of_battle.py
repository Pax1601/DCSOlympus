import asyncio
from asyncio import Semaphore
import math
from random import randrange
from api import API, Unit, UnitSpawnTable
from math import pi
import logging
import threading

from unit import unit

# Setup a logger for the module
logger = logging.getLogger("king_of_battle")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)



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

async def call_splash(time):
    await asyncio.sleep(time)
    print("\nSplash over")

def artillery_time_of_flight(horizontal_distance, initial_muzzle_velocity):
    g = 9.81  # m/s²
    
    # Increase drag coefficient to get closer to 16 seconds
    drag_coefficient = 0.0012  # Increased from 0.0003
    
    # Calculate average velocity accounting for drag
    velocity_loss_factor = math.exp(-drag_coefficient * horizontal_distance)
    final_velocity = initial_muzzle_velocity * velocity_loss_factor
    average_velocity = (initial_muzzle_velocity + final_velocity) / 2
    
    # Calculate angle using average velocity
    sin_2theta = (horizontal_distance * g) / (average_velocity ** 2)
    
    if sin_2theta > 1:
        return 1
        #raise ValueError("Target is beyond maximum range")
        
    
    two_theta = math.asin(sin_2theta)
    theta = two_theta / 2
    
    # Time of flight using average velocity
    time_of_flight = (2 * average_velocity * math.sin(theta)) / g
    
    return time_of_flight

current_mission_on_going = False
mission_is_go = False
shot_add_drop = 0
shot_left_right = 0

async def check_for_mission():
    global current_mission_on_going
    global mission_is_go
    global shot_variance_side
    global shot_variance_length
    global box_width
    global box_length
    global original_target
    global increment
    global original_bearing
    global volley_size
    global total_rounds
    global first_shot
    global final_shot_announced
    global distance
    global rounds_complete
    global observer_angle_to_target
    global shot_add_drop
    global shot_left_right

    if mission_is_go:
        return
    if current_mission_on_going:
        heading_method = input("Mill or degrees? (M/d)")
        if not heading_method or heading_method.lower() == 'm' or heading_method.lower() == 'mill':
            print("Mill selected")
            angle_input = input("Angle in mill (Integer values only)")
            if angle_input.isdigit():
                angle = int(angle_input)
                print(f"Angle set to: {angle} mill")
            else:
                print("Invalid number restarting")
                current_mission_on_going = False
                return
        elif heading_method.lower() == 'd' or heading_method.lower() == 'degree':
            print("Degrees selected")
            angle_input = input("Angle in degrees (Integer values only)")
            if angle_input.isdigit():
                angle = int(angle_input)*17.777778
                angle = int(angle)
                print(f"Angle set to: {angle} mill, converted from {angle_input} degrees")
            else:
                print("Invalid number restarting")
                current_mission_on_going = False
                return
        else:
            current_mission_on_going = False
            return

        distance_of_shot = input("Distance of shot in meters? (Integer values only)")
        if distance_of_shot.isdigit():
            distance = int(distance_of_shot)
            print(f"Distance set to: {distance} meters")
        else:
            print("Invalid number restarting")
            current_mission_on_going = False
            return
        
        observer_angle_input = input("Observer angle to target in degrees? (Integer values only, otherwise assume 0)")
        if observer_angle_input.isdigit():
            observer_angle_to_target = int(observer_angle_input)
            observer_angle_input = observer_angle_input
            print(f"Observer angle to target set to: {observer_angle_to_target} degrees")
        else:
            observer_angle_to_target = 720
                
        box_width_input = input("Dispersion width in meters? (Integer values only, otherwise assume 1)")
        if box_width_input.isdigit():
            box_width = int(box_width_input)
            print(f"Dispersion width set to: {box_width_input}")        
        else:
            box_width = 1

        box_length_input = input("Dispersion length in meters? (Integer values only, otherwise assume 1)")
        if box_length_input.isdigit():
            box_length = int(box_length_input)
            print(f"Dispersion length set to: {box_length_input}")
        else:
            box_length = 1

        incremenet_input = input("Increment per round in meters? (Integer values only, otherwise assume 0)")
        if incremenet_input.isdigit():
            increment = int(incremenet_input)
            print(f"Increment per round set to: {increment} meters")
        else:
            increment = 0

        total_rounds_input = input("Total rounds to be fired in this mission? (Integer values only, otherwise assume 1)")
        if total_rounds_input.isdigit():
            total_rounds = int(total_rounds_input)
            rounds_complete = total_rounds
            print(f"Total rounds to be fired set to: {total_rounds}")
        else:
            total_rounds = 1
            rounds_complete = total_rounds
        
        if total_rounds == 1:
            volley_size = 1
        else:
            volley_size_input = input("Volley size? (Integer values only, otherwise assume 1)")
            if volley_size_input.isdigit():
                volley_size = int(volley_size_input)
                print(f"Volley size set to: {volley_size}")
            else:
                volley_size = 1

        flight_time = artillery_time_of_flight(distance, 708) + 5

        shot_variance_side = math.floor(distance*0.0025)
        shot_variance_length = math.floor(distance*0.005)

        original_target = None
        original_bearing = angle*0.000985 + ((map_mag_var*17.777778)*0.000985)

        first_shot = True
        final_shot_announced = False

        print(f"\n\nDistance {distance}. Direction {angle} mills (or {angle*0.05625} degrees). Rounds {total_rounds} width {box_width}, length {box_length}, time of flight {flight_time:.1f} seconds.\n\n")

        start_mission = input("If this is correct press enter to shoot..., type anything else to cancel")
        if start_mission == "":
            mission_is_go = True
            first_shot = True
            if observer_angle_input == 720:
                observer_angle_to_target = original_bearing
            #total_rounds = 1
            
            # Reset unit states for new mission
            units = api.get_units()
            for unit in units.values():
                if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                    if hasattr(unit, 'setup_as_arty'):
                        unit.setup_as_arty = True  # Reset to allow new setup
                        unit.fire_mission = False  # Reset fire mission state
                        # Clear the arty_target_position so it recalculates
                        if hasattr(unit, 'arty_target_position'):
                            delattr(unit, 'arty_target_position')
            
            print("Mission started, to exit firing loop enter q for quit.\n")
            return
            
    else:
        fire_mission = input("\nExecute new fire mission? (Y/n)")
        if not fire_mission or fire_mission.lower() == 'y' or fire_mission.lower() == 'yes':
            print("Yes")
            current_mission_on_going = True
            # Reset unit states for new mission
        else:
            print("No")

def listen_for_cancel():
    global current_mission_on_going
    global mission_is_go
    global distance
    global first_shot
    global original_target
    global shot_add_drop
    global shot_left_right
    while True:
        if mission_is_go:
            try:
                user_input = input()  # Press Enter to cancel
                if user_input == "q":
                    print(f"\n\nPrior missions mills {original_bearing/0.000985 - (map_mag_var*17.777778)} distance {distance} meters.\n")
                    adjusted_bearing = (original_bearing/0.000985 - (map_mag_var*17.777778))+((unit.position.bearing_to(unit.position.project_with_bearing_and_distance(distance, original_bearing).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2)))*0.000985)
                    adjusted_distance = unit.position.distance_to(unit.position.project_with_bearing_and_distance(distance, original_bearing).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2))
                    print(f"\n\nAdjusted missions mills {adjusted_bearing} distance {adjusted_distance} meters.\n")
                    current_mission_on_going = False
                    mission_is_go = False
                    shot_add_drop = 0
                    shot_left_right = 0
                    # In your check_for_mission() when starting a new mission:
                    units = api.get_units()
                    for unit in units.values():
                        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                            # Delete custom artillery attributes
                            for attr in ['arty_target_position', 'local_arty_target_position', 'setup_as_arty', 
                                        'rounds_complete', 'volley_size', 'current_increment', 'start_ammo', 'salvo_ammo']:
                                if hasattr(unit, attr):
                                    delattr(unit, attr)
                            
                            # Reset core mission attributes to defaults
                            unit.fire_mission = False
                            if hasattr(unit, 'has_fire_mission'):
                                unit.has_fire_mission = False
                elif user_input == "":
                    pass  # Ignore empty input to prevent accidental cancellations
                elif user_input == "a":
                    shot_add_drop += 50
                    print(f"Add 50, new distance {shot_add_drop} m")
                    units = api.get_units()
                    for unit in units.values():
                        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                            original_target = unit.position.project_with_bearing_and_distance(distance, original_bearing).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2)
                            break  # Only need to do this once
                elif user_input == "d":
                    shot_add_drop -= 50
                    print(f"Drop 50, new distance {shot_add_drop} m")
                    units = api.get_units()
                    for unit in units.values():
                        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                            original_target = unit.position.project_with_bearing_and_distance(distance, original_bearing).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2)
                            break  # Only need to do this once
                elif user_input == "x":
                    shot_left_right += 50
                    print(f"Right 50, new distance {shot_left_right} m")
                    units = api.get_units()
                    for unit in units.values():
                        original_target = unit.position.project_with_bearing_and_distance(distance, original_bearing).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2)
                        break  # Only need to do this once
                elif user_input == 'z':
                    shot_left_right -= 50
                    print(f"Left 50, new distance {shot_left_right} m")
                    units = api.get_units()
                    for unit in units.values():
                        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                            original_target = unit.position.project_with_bearing_and_distance(distance, original_bearing).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2)
                            break  # Only need to do this once
                elif user_input == 'c':
                    print(f"Cease fire")
                    units = api.get_units()
                    for unit in units.values():
                        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                            if hasattr(unit, 'arty_target_position'):
                                # Recalculate target position with new distance
                                unit.set_path([unit.position])                                
                                # Reset fire mission to allow new shot
                elif user_input == 'r':
                    print(f"Resuming fire")
                    units = api.get_units()
                    for unit in units.values():
                        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                            if hasattr(unit, 'arty_target_position'):
                                unit.arty_target_position = unit.position.project_with_bearing_and_distance(distance, original_bearing).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2)
                                # Reset fire mission to allow new shot
                                unit.fire_mission = False
                                first_shot = True  # Reset to get "Shot over" message
                elif user_input == 'obs':
                    units = api.get_units()
                    for unit in units.values():
                        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
                            if hasattr(unit, 'arty_target_position'):
                                # Recalculate target position with new distance
                                unit.set_path([unit.position])
                    print("\nCease fire to update observer position in polar co-ordinates from artillery position.\n")


            except EOFError:
                continue  # Handle EOFError gracefully
        

# Start the cancel listener thread
cancel_thread = threading.Thread(target=listen_for_cancel, daemon=True)
cancel_thread.start()
            

mission_type = "adj"
bearing_degrees = 91
bearing_nato_mills = bearing_degrees * 17.777778
#bearing_nato_mills = 1155
distance = 6880
mission_cancelled = False

map_mag_var = 0.9 #ww2 marianas
map_mag_var = 2.8 #afghan

if mission_type == "adj":
    rounds_complete = 1
    volley_size = 1
    box_width = 1
    box_length = 1
    increment = 0
elif mission_type == "pre":
    rounds_complete = 2
    volley_size = 5
    box_width = 1
    box_length = 1
    increment = 0
elif mission_type == "ffe":
    rounds_complete = 12
    volley_size = 2
    box_width = 50
    box_length = 50
    increment = 0
elif mission_type == "cre":
    rounds_complete = 2400
    volley_size = 1
    box_width = 1000
    box_length = 1
    increment = 100
else:
    rounds_complete = 1
    volley_size = 1
    box_width = 1
    box_length = 1
    increment = 0


original_bearing = bearing_nato_mills*0.000985 + ((map_mag_var*17.777778)*0.000985)

shot_variance_side = math.floor(distance*0.0025)
shot_variance_length = math.floor(distance*0.005)
total_rounds = 1
first_shot = True
original_target = None
final_shot_announced = False
mission_is_go = False

async def arty():
    global mission_is_go
    if mission_is_go:
        pass
    else:
        return
    global distance
    global shot_variance_side
    global shot_variance_length
    global box_width
    global box_length
    global original_target
    global increment
    global original_bearing
    global volley_size
    global rounds_complete
    global total_rounds
    global first_shot
    global final_shot_announced
    units = api.get_units()
    for unit in units.values():
        if unit.name == 'L118_Unit' and unit.coalition == 'blue':
            if original_target == None:
                original_target = unit.position.project_with_bearing_and_distance(distance, original_bearing)
            if not hasattr(unit, 'setup_as_arty'):
                #print("Not setup")
                unit.setup_as_arty = True
                unit.rounds_complete = rounds_complete
                unit.volley_size = volley_size
                unit.current_increment = 0
                unit.start_ammo = unit.total_ammo
                unit.fire_mission = False
            elif hasattr(unit, 'setup_as_arty'):
                if hasattr(unit, 'rounds_complete') and hasattr(unit, 'fire_mission') and hasattr(unit, 'volley_size'):
                    if hasattr(unit, 'arty_target_position'):
                        #print("Has arty target position")
                        if unit.fire_mission == False:
                            if total_rounds >= rounds_complete:
                                if unit.setup_as_arty == True:
                                    unit.set_path([unit.position])
                                    unit.setup_as_arty = False
                                else:
                                    pass

                            else:
                                target = original_target.project_with_bearing_and_distance(
                                    randrange(-box_width, box_width),
                                    original_bearing+pi/2
                                )
                                target = target.project_with_bearing_and_distance(
                                    randrange(-box_length, box_length),
                                    original_bearing
                                )
                                target = target.project_with_bearing_and_distance(
                                    randrange(-shot_variance_side, shot_variance_side),
                                    original_bearing+pi/2
                                )
                                target = target.project_with_bearing_and_distance(
                                    randrange(-shot_variance_length, shot_variance_length),
                                    original_bearing
                                )
                                unit.local_arty_target_position = target.project_with_bearing_and_distance(unit.current_increment,0).project_with_bearing_and_distance(shot_add_drop,observer_angle_to_target).project_with_bearing_and_distance(shot_left_right, observer_angle_to_target+pi/2)
                                target = unit.local_arty_target_position
                                unit.fire_at_area(target)
                                unit.current_increment += increment
                                unit.fire_mission = True
                                unit.salvo_ammo = unit.total_ammo
                                total_rounds = total_rounds + 1
                        elif unit.fire_mission == True:
                            #print("Fire mission in effect")
                            if unit.total_ammo <= unit.start_ammo- 1 and first_shot == True:                               
                                time = artillery_time_of_flight(distance, 708)
                                print("\nShot over\n")
                                asyncio.create_task(call_splash(time))
                                first_shot = False
                                if unit.total_ammo <= unit.start_ammo - unit.rounds_complete:
                                    if unit.setup_as_arty == True:
                                        unit.set_path([unit.position])
                                        unit.setup_as_arty = False
                                        #print("Rounds complete")
                                    else:
                                        pass
                                        #print("pass 2")
                                elif unit.total_ammo <= unit.salvo_ammo - unit.volley_size:
                                    unit.fire_mission = False
                            else:
                                if unit.total_ammo <= unit.start_ammo - unit.rounds_complete:
                                    if unit.setup_as_arty == True:
                                        unit.set_path([unit.position])
                                        unit.setup_as_arty = False
                                        #print("Rounds complete")
                                    else:
                                       pass #print("pass 3")
                                elif unit.total_ammo <= unit.salvo_ammo - unit.volley_size:
                                    unit.fire_mission = False

                    else:
                        #print("Fire mission")
                        unit.arty_target_position = unit.position.project_with_bearing_and_distance(distance, original_bearing)
                        total_rounds = 0

async def on_api_update(api: API):
    asyncio.create_task(check_for_mission())
    asyncio.create_task(arty())


if __name__ == "__main__":
    api = API()
    api.register_on_startup_callback(on_api_startup)
    api.register_on_update_callback(on_api_update)
    api.run()