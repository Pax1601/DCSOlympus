import asyncio
from random import randrange
from api import API, Unit, UnitSpawnTable
from math import pi

# Setup a logger for the module
import logging
logger = logging.getLogger("example_disembarked_infantry")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

units_to_delete = None

#############################################################################################
# This class represents a disembarked infantry unit that will engage in combat              
# after disembarking from a vehicle. It will move forward and engage the closest enemy.     
#############################################################################################
class DisembarkedInfantry(Unit):
    def __str__(self):
        return f"DisembarkedInfrantry(unit_id={self.unit_id}, group_id={self.group_id}, position={self.position}, heading={self.heading})"
    
    def start_fighting(self, random_bearing: bool = False):
        """
        Start the fighting process for the unit. The unit will go forward 30 meters in the direction of the closest enemy and then start a firefight 
        with the closest enemy unit.
        """
        logger.info(f"Unit {self.unit_id} is now fighting.")

        # Pick a random target
        target = self.pick_random_target()

        if random_bearing:
            # If random_bearing is True use a random bearing
            bearing = randrange(0, 100) / 100 * pi * 2
        elif target is None:
            # If no target is found, use the unit's current heading
            bearing = self.heading
        else:
            bearing = self.position.bearing_to(target.position)

        # Project the unit's position 30 meters
        destination = self.position.project_with_bearing_and_distance(30, bearing)

        # Set the destination for the unit
        self.set_path([destination])
        
        # Register a callback for when the unit reaches its destination
        self.register_on_destination_reached_callback(
            self.on_destination_reached,
            destination,
            threshold=15.0, 
            timeout=30.0 # Timeout after 30 seconds if the destination is not reached
        )
        
    def pick_random_target(self):
        # Find the closest enemy unit
        targets = self.api.get_closest_units(
            ["neutral", "red" if self.coalition == "blue" else "blue"], 
            ["groundunit"],
            self.position,
            "red" if self.coalition == "blue" else "blue",
            10
        )
        # Pick a random enemy from the list
        target = targets[randrange(len(targets))] if targets else None
        return target

    async def on_destination_reached(self, _, reached: bool):
        if not reached:
            logger.info(f"Unit {self} did not reach its destination.")
        else:
            logger.info(f"Unit {self} has reached its destination.")
        
        target = self.pick_random_target()
                    
        if target is None:
            logger.info("No enemies found nearby. Resuming patrol.")
            await asyncio.sleep(1)  
            self.start_fighting(not reached)  # Restart the fighting process, randomizing the bearing if not reached
        else:             
            # Compute the bearing to the target
            bearing_to_enemy = self.position.bearing_to(target.position)

            # Simulate a firefight in the direction of the enemy
            firefight_destination = self.position.project_with_bearing_and_distance(30, bearing_to_enemy)
            self.simulate_fire_fight(firefight_destination.lat, firefight_destination.lng, firefight_destination.alt + 1)
            
            await asyncio.sleep(10)  # Simulate some time spent in firefight
            self.start_fighting()  # Restart the fighting process

#############################################################################################
# This function is called when the API starts up. It will delete all blue units that are not human and alive. 
#############################################################################################
def on_api_startup(api: API):
    global units_to_delete
    logger.info("API started")
    
    # Get all the units from the API. Force an update to get the latest units.
    units = api.update_units()
    
    # Initialize the list to hold units to delete
    units_to_delete = []

    # Delete the AI blue units
    for unit in units.values():
        if unit.alive and not unit.human and unit.coalition == "blue":
            units_to_delete.append(unit)
            try:
                unit.delete_unit(False, "", True)
                unit.register_on_property_change_callback("alive", on_unit_alive_change)
                
                logger.info(f"Deleted unit: {unit}")
            except Exception as e:
                logger.error(f"Failed to delete unit {unit}: {e}")

#################################################################################################
# This function is called when a unit's alive property changes. If the unit is deleted,
# it will be removed from the units_to_delete list. If all units are deleted, it will spawn a new unit.
#################################################################################################
def on_unit_alive_change(unit: Unit, value: bool):
    global units_to_delete
    
    if units_to_delete is None:
        logger.error("units_to_delete is not initialized.")
        return
    
    # Check if the unit has been deleted
    if value is False:
        if unit in units_to_delete:
            units_to_delete.remove(unit)
            logger.info(f"Unit {unit} has been deleted and removed from the list.")
        else:
            logger.warning(f"Unit {unit} is not in the deletion list, but it is marked as dead.")

##############################################################################################
# This function is called when the API updates. It checks if all units have been deleted and
# if so, it spawns new units near a human unit that is alive and on the ground.
##############################################################################################           
def on_api_update(api: API):
    global units_to_delete
    if units_to_delete is not None and len(units_to_delete) == 0:
        logger.info("All units have been deleted successfully.")
        units_to_delete = None
        
        # Get the units from the API
        logger.info("Spawning a disembarked infantry units.")
        units = api.get_units()
        
        # Find the first human unit that is alive and on the ground
        for unit in units.values():
            if unit.human and unit.alive and not unit.airborne:
                for i in range(10):
                    # Spawn unit nearby
                    spawn_position = unit.position.project_with_bearing_and_distance(10, unit.heading + pi / 2 + 0.2 * i)
                    spawn_table: UnitSpawnTable = UnitSpawnTable(
                        unit_type="Soldier M4",
                        location=spawn_position,
                        heading=unit.heading + pi / 2 + 0.2 * i,
                        skill="High",
                        livery_id=""            
                    )
                    
                    # Define the callback for when the unit is spawned. This is an asynchronous function but could be synchronous too.
                    async def execution_callback(new_group_ID: int):
                        logger.info(f"New units spawned, groupID: {new_group_ID}")
                        
                        units = api.get_units()
                        for new_unit in units.values():
                            if new_unit.group_id == new_group_ID:
                                logger.info(f"New unit spawned: {new_unit}")
                                
                                new_unit.__class__ = DisembarkedInfantry
                                new_unit.start_fighting()
                                
                    api.spawn_ground_units([spawn_table], unit.coalition, "", True, 0, lambda new_group_ID: execution_callback(new_group_ID))
                    logger.info(f"Spawned new unit succesfully at {spawn_position} with heading {unit.heading}")
            break

##############################################################################################
# Main entry point for the script. It registers the callbacks and starts the API.
##############################################################################################         
if __name__ == "__main__":
    # Initialize the API
    api = API()
    
    # Register the callbacks
    api.register_on_update_callback(on_api_update)
    api.register_on_startup_callback(on_api_startup)

    # Start the API, this will run forever until stopped
    api.run()
    
    