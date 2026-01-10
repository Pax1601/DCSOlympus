from api import API, Unit
from atc.agency.airbase_agency import AirbaseAgency
from atc.agency.airbase import Airbase
import logging


from atc.utils import spell_frequency
from atc_old.agency import ATCUnit

class Tower(AirbaseAgency):
    def __init__(self, name, config: dict, api: API, logger: logging.Logger, kml: dict, airbase: Airbase):
        super().__init__(name, config, api, logger, kml, airbase)
        self.logger.info(f"Initializing Tower: {name}")

        from atc.atc_unit import ATCUnit
        self.cleared_for_takeoff_unit: ATCUnit | None = None
        self.cleared_to_land_unit: ATCUnit | None = None

    # Get the predefined sentences for Base
    def get_sentences(self):
        return {
                "departure": ["departure.", "ready for departure.", "requesting departure.", "holding short, ready for departure."],
                "abeam": ["abeam.", "abeam the runway.", "abeam to land.."],
                "go around": ["go around.", "going around."],
                "stay in the pattern": ["stay in the pattern.", "remain in the pattern."],
                "cleared for takeoff": ["cleared for takeoff."],
                "cleared to land": ["cleared to land."],
                "downwind": ["downwind."],
                "final": ["final."],
                "affirmative": ["affirmative."],
                "initials": ["initials."],
                "downwind outer": ["downwind outer pattern."],
                "negative": ["negative."],
        }
        
    # Get radio prompt specific to Tower
    def get_radio_prompt(self):
        return f"{self.name}, runway, ready, departure, land, abeam, downwind."
    
    # Check if a unit is under Tower's control
    def is_valid_agency(self, unit):
        # Implement logic to determine if the unit is valid for Tower control
        self.logger.info(f"Validating unit {unit.callsign} for Tower agency")
        return True  # Placeholder implementation, TODO
    
    # Update Tower
    def update(self):
        # Update 1: Check if the cleared for takeoff unit is still on the ground and alive
        if self.cleared_for_takeoff_unit:
            if self.cleared_for_takeoff_unit.airborne or not self.cleared_for_takeoff_unit.alive:
                self.logger.info(f"Unit {self.cleared_for_takeoff_unit.callsign} is no longer on the ground or alive, clearing takeoff clearance.")
                self.cleared_for_takeoff_unit = None

        # Update 2: Check if the cleared to land unit has landed or is going around
        if self.cleared_to_land_unit:
            if self.cleared_to_land_unit.airborne == False or not self.cleared_to_land_unit.alive or self.cleared_to_land_unit.get_going_around():
                self.logger.info(f"Unit {self.cleared_to_land_unit.callsign} has landed or is no longer alive, clearing landing clearance.")
                self.cleared_to_land_unit = None
    
    # Check takeoff clearance
    def check_takeoff_clearance(self, unit: Unit) -> tuple[str, bool, bool]:
        """
        Check if the given unit has takeoff clearance.
        Args:
            unit (ATCUnit): The unit requesting takeoff clearance.

        Returns:
            str: Response message regarding takeoff clearance.
            bool: True if cleared for takeoff, False otherwise.
            bool: True if we should keep checking, False otherwise.
        """
        from atc.atc_unit import ATCUnit
        if not isinstance(unit, ATCUnit):
            self.logger.warning(f"Unit {unit.callsign} is not an ATCUnit, cannot check takeoff clearance.")
            return ("Negative, you are not under my control.", False, False)

        # Implement logic to check if the unit has takeoff clearance
        self.logger.info(f"Checking takeoff clearance for unit {unit.callsign}")
        
        # Check 1: Is the unit on the ground?
        if unit.airborne:
            return ("Negative, you are already airborne.", False, False) # TODO: handle helicopters
        
        # Check 2: Is the unit under this agency's control?
        if not self.is_valid_agency(unit):
            return ("Negative, you are not under my control.", False, False)
        
        # Check 3: Is the aircraft near the runway threshold?
        runway = self.airbase.get_active_runway()
        threshold_coords = runway.get_threshold_coordinates()
        distance_to_threshold = unit.position.distance_to(threshold_coords)
        if distance_to_threshold > 200:  # 200 meters threshold
            ground = self.airbase.get_ground_agency()
            if ground:
                message = f"Your are not in position for departure, switch to ground for taxi instructions on {spell_frequency(ground.listener.frequency)}."
            else:
                message = f"Your are not in position for departure, taxi to hold short runway {runway.spell_name()}."
            return (message, False, False)

        # Check 4: Was the unit already cleared for takeoff?
        if self.cleared_for_takeoff_unit == unit:
            return (f"You are already cleared for takeoff, runway {self.airbase.get_active_runway().spell_name()}.", True, False)
        
        # Check 5: Is there another unit already cleared for takeoff?
        if self.cleared_for_takeoff_unit and self.cleared_for_takeoff_unit != unit:
            return ("Hold position.", False, True)
        
        # Check 6: Is the runway clear?
        units = self.api.get_units()
        # Remove self from the list so we don't check against ourselves
        del units[unit.ID]
        if not runway.is_clear(units.values()):
            return ("Hold position.", False, True)
        
        # Check 7: Is another unit cleared to land?
        if self.cleared_to_land_unit:
            return ("Hold position.", False, True)
        
        # If all checks passed, clear the unit for takeoff
        self.cleared_for_takeoff_unit = unit
        return (f"Cleared for takeoff runway {runway.spell_name()}. {self.airbase.spell_wind()}. {runway.get_takeoff_procedure()}", True, False)
        
        