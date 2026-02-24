"""
Advanced Ground Unit Control Plugin for DCS Olympus API

This plugin provides advanced control and management capabilities for ground units.
"""

import sys
from pathlib import Path
import asyncio
from collections import defaultdict

import numpy as np
from sklearn.cluster import DBSCAN

# Add the API directory to the path so we can import the Plugin base class
api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from api import API
from plugin_base import Plugin

try:
    from .advancedgroundunit import AdvancedGroundUnit
except ImportError:
    from advancedgroundunit import AdvancedGroundUnit

try:
    from .advancedgroundunitscluster import AdvancedGroundUnitsCluster
except ImportError:
    from advancedgroundunitscluster import AdvancedGroundUnitsCluster

class AdvancedGroundUnitControl(Plugin):
    """
    Advanced Ground Unit Control plugin.
    """
    
    def __init__(self, plugin_info, global_config=None):
        """
        Initialize the Advanced Ground Unit Control plugin.
        
        Args:
            plugin_info: Plugin descriptor information
            global_config: Global configuration dictionary
        """
        super().__init__(plugin_info, global_config)
        
        # Get configuration from plugin descriptor
        self.config = plugin_info.get("config", {})
        self.update_interval = self.config.get("update_interval", 1.0)
        self.cluster_threshold_m = float(self.config.get("cluster_threshold_m", 100.0))
        self.cluster_min_samples = max(1, int(self.config.get("cluster_min_samples", 1)))
        self.debug_mode = self.config.get("debug_mode", False)
        
        # Plugin state
        self.running = False
        self.paused = False
        
        # API instance (to be initialized)
        self.api = None

        # Cluster state
        self.clusters: dict[int, AdvancedGroundUnitsCluster] = {}
        
        self.logger.info(f"Advanced Ground Unit Control initialized")
        self.logger.info(f"  Update interval: {self.update_interval}s")
        self.logger.info(f"  Cluster threshold: {self.cluster_threshold_m}m")
        self.logger.info(f"  Cluster min samples: {self.cluster_min_samples}")
        self.logger.info(f"  Debug mode: {self.debug_mode}")
        
        # Log global config info
        if self.global_config:
            dcs_folder = self.global_config.get('dcs_saved_games_folder', 'Not set')
            self.logger.info(f"  DCS Saved Games: {dcs_folder}")
    
    def on_start(self, loop: asyncio.AbstractEventLoop) -> bool:
        """
        Start the Advanced Ground Unit Control plugin.
        
        Returns:
            bool: True if started successfully, False otherwise
        """
        try:
            self.logger.info("Starting Advanced Ground Unit Control...")
            
            # Initialize API connection
            # Initialize the API
            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'), load_kokoro=False, load_whisper=False)
            
            # Register the callbacks
            self.api.register_on_update_callback(lambda api: self.on_api_update(api))
            self.api.register_on_startup_callback(lambda api: self.on_api_startup(api))
            
            self.api.interval = self.update_interval

            # Set plugin state
            self.running = True
            self.paused = False   
            
            self.api.register_asyncio_coroutine(loop)
            
            self.logger.info("Advanced Ground Unit Control started successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to start Advanced Ground Unit Control: {e}", exc_info=True)
            return False
    
    def on_stop(self) -> bool:
        """
        Stop the Advanced Ground Unit Control plugin.
        
        Returns:
            bool: True if stopped successfully, False otherwise
        """
        try:
            self.logger.info("Stopping Advanced Ground Unit Control...")
            
            # Set plugin state
            self.running = False
            
            # TODO: Stop background threads/loops
            
            # Clean up resources
            self.clusters.clear()
            
            # Close API connection if needed
            if self.api:
                # TODO: Clean up API connection
                pass
            
            self.logger.info("Advanced Ground Unit Control stopped successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to stop Advanced Ground Unit Control: {e}", exc_info=True)
            return False
    
    def on_pause(self) -> bool:
        """
        Pause the Advanced Ground Unit Control plugin.
        
        Returns:
            bool: True if paused successfully, False otherwise
        """
        try:
            self.logger.info("Pausing Advanced Ground Unit Control...")
            
            self.paused = True
            
            self.logger.info("Advanced Ground Unit Control paused successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to pause Advanced Ground Unit Control: {e}", exc_info=True)
            return False
    
    def on_resume(self) -> bool:
        """
        Resume the Advanced Ground Unit Control plugin from pause.
        
        Returns:
            bool: True if resumed successfully, False otherwise
        """
        try:
            self.logger.info("Resuming Advanced Ground Unit Control...")
            
            self.paused = False
            
            self.logger.info("Advanced Ground Unit Control resumed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to resume Advanced Ground Unit Control: {e}", exc_info=True)
            return False
        
    def on_api_update(self, api: API):
        """
        Callback function for API updates.
        
        Args:
            api: API instance providing access to game data
        """
        if not self.running or self.paused:
            return
        
        try:
            # Get control of units
            self._get_control_of_ground_units(api)
            
        except Exception as e:
            self.logger.error(f"Error during API update: {e}", exc_info=True)
            
    def on_api_startup(self, api: API):
        """
        Callback function for API startup.
        
        Args:
            api: API instance providing access to game data
        """
        self.logger.info("API startup callback triggered")
        
    def _get_control_of_ground_units(self, api: API):
        """
        Internal method to get control of ground units.
        
        Args:
            api: API instance providing access to game data
        """
        try:
            units = api.get_units()
            coalition_units = defaultdict(list)
            
            # Loop on the units and check if they are ground, neutral units with a "operate as" that is not neutral
            for unit_id, unit in units.items():
                # TODO also check if the user took exclusive control of the unit
                if (
                    unit.category == "GroundUnit"
                    and unit.controlled == True
                    and unit.alive
                ):
                    # Check if the unit is already of the AdvancedGroundUnit type, if not, convert it and take control
                    if not isinstance(unit, AdvancedGroundUnit):
                        self.logger.info(f"Taking control of unit {unit.name} (ID: {unit_id})")
                        unit.__class__ = AdvancedGroundUnit
                    coalition_units[unit.operate_as].append(unit)
                    
            self._cluster_units_by_coalition(coalition_units)
            
            # Run cluster logic for each cluster
            for cluster in self.clusters.values():
                cluster.run_cluster_logic(api, self.logger, self.clusters)
            
        except:
            self.logger.error("Failed to get units from API", exc_info=True)
            return

    def _cluster_units_by_coalition(self, coalition_units):
        """
        Cluster AdvancedGroundUnit instances per coalition and synchronize
        AdvancedGroundUnitsCluster objects and their members.

        Arg-s:
            coalition_units: Dict mapping coalition name to list of AdvancedGroundUnit.
        """
        desired_members_by_key = {}

        for coalition, units in coalition_units.items():
            if not units:
                continue

            if len(units) == 1:
                unit = units[0]
                cluster_key = f"{coalition}:single:{unit.ID}"
                desired_members_by_key[cluster_key] = [unit]
                continue

            distance_matrix = np.zeros((len(units), len(units)), dtype=float)

            for i in range(len(units)):
                for j in range(i + 1, len(units)):
                    dist = units[i].position.distance_to(units[j].position)
                    distance_matrix[i, j] = dist
                    distance_matrix[j, i] = dist

            labels = DBSCAN(
                eps=self.cluster_threshold_m,
                min_samples=self.cluster_min_samples,
                metric="precomputed"
            ).fit_predict(distance_matrix)

            label_to_members = defaultdict(list)

            for idx, label in enumerate(labels):
                unit = units[idx]

                # DBSCAN noise points (-1) are treated as one-unit clusters.
                if label == -1:
                    cluster_key = f"{coalition}:noise:{unit.ID}"
                    desired_members_by_key[cluster_key] = [unit]
                else:
                    label_to_members[label].append(unit)

            for label, members in label_to_members.items():
                cluster_key = f"{coalition}:cluster:{label}"
                desired_members_by_key[cluster_key] = members

        self._sync_clusters(desired_members_by_key)

        if self.debug_mode:
            self.logger.debug(f"Synchronized {len(self.clusters)} active cluster(s)")

    def _sync_clusters(self, desired_members_by_key):
        """
        Reconcile existing clusters with desired memberships:
        - Create missing clusters
        - Remove units no longer belonging to a cluster
        - Remove units that are no longer alive
        - Add units to target clusters
        - Remove empty/stale clusters
        """
        current_keys = set(self.clusters.keys())
        desired_keys = set(desired_members_by_key.keys())

        # Prune dead members from all existing clusters.
        for cluster in self.clusters.values():
            for member in list(cluster.members):
                if not member.alive:
                    cluster.remove_member(member)

        # Remove stale clusters entirely.
        for cluster_key in current_keys - desired_keys:
            cluster = self.clusters[cluster_key]
            for member in list(cluster.members):
                cluster.remove_member(member)
            del self.clusters[cluster_key]

        # Create/update desired clusters.
        for cluster_key, desired_members in desired_members_by_key.items():
            cluster = self.clusters.get(cluster_key)
            if cluster is None:
                cluster = AdvancedGroundUnitsCluster(self.logger)
                self.clusters[cluster_key] = cluster

            alive_desired_members = [unit for unit in desired_members if unit.alive]
            desired_ids = {unit.ID for unit in alive_desired_members}
            current_members_by_id = {unit.ID: unit for unit in cluster.members}

            # Remove members that no longer belong.
            for unit_id, unit in list(current_members_by_id.items()):
                if unit_id not in desired_ids or not unit.alive:
                    cluster.remove_member(unit)

            # Add new members.
            updated_members_by_id = {unit.ID: unit for unit in cluster.members}
            for unit in alive_desired_members:
                if unit.ID not in updated_members_by_id:
                    cluster.add_member(unit)

        # Remove clusters that ended up empty.
        for cluster_key in list(self.clusters.keys()):
            if len(self.clusters[cluster_key].members) == 0:
                del self.clusters[cluster_key]
            
