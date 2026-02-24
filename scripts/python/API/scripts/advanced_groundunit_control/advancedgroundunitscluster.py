try:
    from .advancedgroundunit import AdvancedGroundUnit
except ImportError:
    from advancedgroundunit import AdvancedGroundUnit
    
from enum import Enum
import math

from data.data_types import LatLng

class States(Enum):
    IDLE = "idle"
    MOVING = "moving"
    ATTACKING = "attacking"
    
class Strategies(Enum):
    IDLE = "idle"
    SEARCH_AND_DESTROY = "search_and_destroy"
    RETREAT = "retreat"
    
class Formations(Enum):
    CIRCLE = "circle"
    LINE = "line"

class AdvancedGroundUnitsCluster:
    def __init__(self, logger):
        self.logger = logger
        
        self.members: list[AdvancedGroundUnit] = []
        
        self.logger.info("Initialized AdvancedGroundUnitsCluster")
        
        self.formation = Formations.LINE  # Example formation type, could be extended to support different formations
        self.desired_center = None  # Desired center position for the cluster, could be set based on mission objectives or other logic
        self.current_center = None  # Current center position of the cluster, calculated based on member unit positions
        
        self.state = States.IDLE
        
        self.strategy = Strategies.SEARCH_AND_DESTROY 
        self.closest_enemy_cluster = None  # Closest enemy cluster, updated in the cluster logic based on the current strategy
         
    def add_member(self, unit: AdvancedGroundUnit):
        self.members.append(unit)
        self.logger.info(f"Added unit {unit.name} (ID: {unit.ID}) to cluster")
        
        # Reset the destination of the unit to trigger pathfinding logic in the next update cycle
        unit.set_path([])  # Clear the unit's path to force it to recalculate its path based on the new cluster logic
                
    def remove_member(self, unit: AdvancedGroundUnit):
        if unit in self.members:
            self.members.remove(unit)
            self.logger.info(f"Removed unit {unit.name} (ID: {unit.ID}) from cluster")
        else:
            self.logger.warning(f"Attempted to remove unit {unit.name} (ID: {unit.ID}) from cluster, but it was not a member")
            
    def run_cluster_logic(self, api, logger, clusters):
        """
        Method to run the cluster logic for all member units.
        This is where you would implement the specific behavior you want for the cluster of units.
        """
        logger.debug(f"Running cluster logic for cluster with {len(self.members)} members")
        
        # Update the position of the cluster based on the positions of its members
        num_units = len(self.members)
        if num_units == 0:
            return
        
        center_lat = sum(unit.position.lat for unit in self.members) / num_units
        center_lng = sum(unit.position.lng for unit in self.members) / num_units
        
        self.current_center = LatLng(center_lat, center_lng, 0)
        
        # If all the units in the cluster have the "offensive" posture, set the strategy to SEARCH_AND_DESTROY
        if all(unit.posture == 4 for unit in self.members):
            self.strategy = Strategies.SEARCH_AND_DESTROY
        # If any unit in the cluster has the "defensive" posture, set the strategy to RETREAT
        elif any(unit.posture == 2 for unit in self.members):
            self.strategy = Strategies.RETREAT
        else:
            self.strategy = Strategies.IDLE
                
        # Run the cluster strategy logic to determine the desired center and state of the cluster based on the current strategy
        self.cluster_strategy(api, logger, clusters)
        self.low_level_cluster_logic(api, logger, clusters)
        
    def set_state(self, new_state: States):
        if new_state != self.state:
            self.logger.info(f"Cluster state changed from {self.state} to {new_state}")
            self.state = new_state
            
            # Reset the path of every unit in the cluster to trigger pathfinding logic based on the new state
            for unit in self.members:
                unit.set_path([])  # Clear the unit's path to force it to recalculate its path based on the new state
                    
    def cluster_strategy(self, api, logger, clusters):
        if self.strategy == Strategies.IDLE:
            self.set_state(States.IDLE)
        elif self.strategy == Strategies.SEARCH_AND_DESTROY:
            self.closest_enemy_cluster, _ = self.find_nearest_enemy_cluster(clusters)
            if self.closest_enemy_cluster and self.closest_enemy_cluster.current_center:
                # Check if any member unit is withing a certain distance from the closest enemy unit
                closest_enemy_unit, closest_distance = self.find_nearest_enemy_unit(api, logger, self.closest_enemy_cluster)
                
                if closest_enemy_unit and closest_distance < 0.75 * self.get_maximum_engagement_range():
                    if self.state != States.ATTACKING:
                        self.set_state(States.ATTACKING)
                        logger.info("Cluster using SEARCH_AND_DESTROY strategy, attacking nearest enemy unit")
                    return
                else:
                    self.desired_center = self.closest_enemy_cluster.current_center
                    if self.state != States.MOVING:
                        self.set_state(States.MOVING)
                        logger.info("Cluster using SEARCH_AND_DESTROY strategy, moving towards nearest enemy cluster")
            else:
                if self.state != States.IDLE:
                    self.set_state(States.IDLE)
                    logger.info("Cluster using SEARCH_AND_DESTROY strategy, but no enemy clusters found, remaining idle")
        elif self.strategy == Strategies.RETREAT:
            self.closest_enemy_cluster, _ = self.find_nearest_enemy_cluster(clusters)
            if self.closest_enemy_cluster and self.closest_enemy_cluster.current_center:
                # Set the desired center to be in the opposite direction from the closest enemy cluster
                bearing_to_enemy = self.current_center.bearing_to(self.closest_enemy_cluster.current_center)
                retreat_distance = 100.0  # Example distance to retreat
                self.desired_center = self.current_center.project_with_bearing_and_distance(retreat_distance, bearing_to_enemy + math.pi)  # Move in the opposite direction of the enemy cluster
                
                if self.state != States.MOVING:
                    self.set_state(States.MOVING)
                    logger.info("Cluster using RETREAT strategy, moving away from nearest enemy cluster")
            else:
                if self.state != States.IDLE:
                    self.set_state(States.IDLE)
                    logger.info("Cluster using RETREAT strategy, but no enemy clusters found, remaining idle")
            
    def low_level_cluster_logic(self, api, logger, clusters):        
        if self.state == States.IDLE:
            pass
        elif self.state == States.MOVING:
            # Initialize the desired center to the current center if it hasn't been set yet
            if self.desired_center == None:
                self.desired_center = self.current_center
            else:
                # Move to find the desired center
                if self.desired_center.distance_to(self.current_center) > 10.0:  # Example threshold for when to update the desired center
                    if self.formation == Formations.CIRCLE:
                        self._move_in_circle(self.desired_center)
                    elif self.formation == Formations.LINE:
                        self._move_in_line(self.desired_center)
        elif self.state == States.ATTACKING:
            if self.closest_enemy_cluster:
                for unit in self.members:
                    closest_enemy_unit, closest_distance = self.find_nearest_enemy_unit_from_unit(api, logger, unit, self.closest_enemy_cluster)
                    if closest_enemy_unit:
                        # If the unit is too far away keep moving towards the closest enemy unit, otherwise engage
                        if closest_distance > unit.engagement_range:
                            if len(unit.active_path) == 1 and unit.active_path[0].distance_to(closest_enemy_unit.position) < 10.0:
                                continue  # Already moving towards the closest enemy unit, no need to update the path
                            
                            unit.set_path([closest_enemy_unit.position])
                            logger.info(f"Unit {unit.name} (ID: {unit.ID}) moving towards closest enemy unit {closest_enemy_unit.name} (ID: {closest_enemy_unit.ID}) to engage")
                        else:
                            if unit.state != 'simulate-engagement':
                                unit.simulate_engagement()
                                logger.info(f"Unit {unit.name} (ID: {unit.ID}) engaging closest enemy unit {closest_enemy_unit.name} (ID: {closest_enemy_unit.ID})")
            
    def find_nearest_enemy_cluster(self, clusters):
        # Find the closest enemy cluster
        closest_distance = float('inf')
        closest_enemy_cluster = None
        for cluster in clusters.values():
            if len(cluster.members) == 0 or cluster is self:
                continue
            
            other_cluster_coalition = cluster.members[0].coalition if cluster.members[0].coalition != 'neutral' else cluster.members[0].operate_as
            this_cluster_coalition = self.members[0].coalition if self.members[0].coalition != 'neutral' else self.members[0].operate_as
            
            if this_cluster_coalition == 'neutral' or other_cluster_coalition == 'neutral':
                continue  # Skip clusters that are true neutrals
            
            # Identify enemy cluster
            if this_cluster_coalition != other_cluster_coalition:
                if cluster.current_center is None or self.current_center is None:
                    continue
                distance = self.current_center.distance_to(cluster.current_center)
                if distance < closest_distance:
                    closest_distance = distance
                    closest_enemy_cluster = cluster
        return closest_enemy_cluster, closest_distance
    
    def find_nearest_enemy_unit(self, api, logger, enemy_cluster):
        # Find the closest enemy unit in the given enemy cluster
        closest_distance = float('inf')
        closest_enemy_unit = None
        for enemy_unit in enemy_cluster.members:
            for friendly_unit in self.members:
                if enemy_unit.position is None or friendly_unit.position is None:
                    continue
                distance = friendly_unit.position.distance_to(enemy_unit.position)
                if distance < closest_distance:
                    closest_distance = distance
                    closest_enemy_unit = enemy_unit
        return closest_enemy_unit, closest_distance
    
    def find_nearest_enemy_unit_from_unit(self, api, logger, unit, cluster):
        # Find the closest enemy unit to the given unit in the given enemy cluster
        closest_distance = float('inf')
        closest_enemy_unit = None
        for enemy_unit in cluster.members:
            if enemy_unit.position is None or unit.position is None:
                continue
            distance = unit.position.distance_to(enemy_unit.position)
            if distance < closest_distance:
                closest_distance = distance
                closest_enemy_unit = enemy_unit
        return closest_enemy_unit, closest_distance

    def get_maximum_engagement_range(self):
        # Example method to calculate the maximum engagement range of the cluster based on the capabilities of its member units
        max_range = 0.0
        for unit in self.members:
            if unit.engagement_range > max_range:
                max_range = unit.engagement_range
        return max_range
    
    def _move_in_circle(self, destination: LatLng): 
        radius = 50.0  # Example radius for the circle formation
        
        # Arrange the units in the cluster in a circle
        num_units = len(self.members)
        if num_units == 0:
            return
        
        for i, unit in enumerate(self.members):
            angle = 2 * 3.14159 * i / num_units
            target_latlng = destination.project_with_bearing_and_distance(radius, angle)
            
            if len(unit.active_path) == 1 and unit.active_path[0].distance_to(target_latlng) < 10.0:
                continue  # Already moving towards the target position in the line, no need to update the path
            
            unit.set_path([target_latlng])
            self.logger.debug(f"Updated position for unit {unit.name} (ID: {unit.ID}) to {unit.position}")
                
    def _move_in_line(self, destination: LatLng):
        spacing = 10.0  # Example spacing between units in the line formation
        
        # Arrange the units in the cluster in a line
        num_units = len(self.members)
        if num_units == 0:
            return
        
        # Compute the bearing from the current center to the destination to determine the line orientation
        bearing = self.current_center.bearing_to(destination)
        
        for i, unit in enumerate(self.members):
            offset = (i - (num_units - 1) / 2) * spacing
            target_latlng = destination.project_with_bearing_and_distance(offset, bearing - math.pi / 2)  # Example bearing for line formation
            
            if len(unit.active_path) == 1 and unit.active_path[0].distance_to(target_latlng) < 10.0:
                continue  # Already moving towards the target position in the line, no need to update the path
            
            unit.set_path([target_latlng])
            self.logger.debug(f"Updated position for unit {unit.name} (ID: {unit.ID}) to {unit.position}")
            
            