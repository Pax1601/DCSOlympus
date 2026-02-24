import asyncio
from asyncio import Semaphore
from random import randrange
from api import API, Unit, UnitSpawnTable
from math import pi
import logging
import time

# Set some globals up
max_range = 1500  # Maximum range to look for targets

# Setup a logger for the module
logger = logging.getLogger("ambience_firefights")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

fighter_inf_red = {"Infantry AK Ins"}
fighter_inf_blue = {"soldier_wwii_us","Soldier M4 GRG"}
fighter_types = fighter_inf_blue.union(fighter_inf_red)

class AmbienceFighter(Unit):
    def __str__(self):
        return f"DisembarkedInfrantry(unit_id={self.unit_id}, group_id={self.group_id}, position={self.position}, heading={self.heading})"

    def __init__(self, Unit):
        self.unit = Unit

    def pick_random_target(self):
        units = api.get_units()
        for unit in units.values():
            target_units = [
                    (unit, unit.position.distance_to(self.unit.position))
                    for unit in units.values()
                        if unit.alive
                        and unit.coalition != self.unit.coalition
                        and unit.position.distance_to(self.unit.position) < max_range
                ]

            targets_sorted = sorted(target_units, key=lambda x: x[1])
            if not targets_sorted:
                return None
            else:
                return targets_sorted[randrange(0, len(targets_sorted))][0]

async def generate_fights():
    units = api.get_units()
    for fighter in units.values():
        if fighter.alive and fighter.name in fighter_types:
            fighter = AmbienceFighter(fighter)
            target = fighter.pick_random_target()
            if fighter.unit.roe == 'return': 
                if target is None:
                    if not hasattr(fighter.unit, 'ambience_fighter_state'):
                        fighter.unit.ambience_fighter_state = 'patrolling'
                    else:
                        pass
                else:
                    if not hasattr(fighter.unit, 'ambience_fighter_state'):
                        fighter.unit.ambience_fighter_state = 'engaging'
                    elif fighter.unit.ambience_fighter_state == 'patrolling':
                        fighter.unit.ambience_fighter_state = 'engaging'
                    elif fighter.unit.ambience_fighter_state == 'engaging':
                        fighter.unit.simulate_fire_fight(target.position,target.position.alt+randrange(1,20))
                        await asyncio.sleep(5)
                        destination = fighter.unit.position.project_with_bearing_and_distance(20,randrange(0,100)*2*pi/100)
                        fighter.unit.set_path([destination,fighter.unit.position])                    
                        fighter.unit.ambience_fighter_state = 'seeking_cover'
                    elif fighter.unit.ambience_fighter_state == 'seeking_cover':
                        destination = fighter.unit.position.project_with_bearing_and_distance(20,randrange(0,100)*2*pi/100)
                        fighter.unit.set_path([destination,fighter.unit.position])
                        await asyncio.sleep(5)
                        fighter.unit.ambience_fighter_state = 'patrolling'


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

async def on_api_update(api: API):    
    asyncio.create_task(generate_fights())
    await asyncio.sleep(3)


if __name__ == "__main__":
    api = API()
    api.register_on_startup_callback(on_api_startup)
    api.register_on_update_callback(on_api_update)
    api.run()