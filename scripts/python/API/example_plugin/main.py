"""
Example Plugin for DCS Olympus API

This is a sample plugin that demonstrates how to create a plugin
by inheriting from the Plugin base class.
"""

import asyncio
import sys
import time
import threading
from pathlib import Path

# Add the API directory to the path so we can import the Plugin base class
api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from plugin_base import Plugin


class ExamplePlugin(Plugin):
    """
    Example plugin that demonstrates the plugin lifecycle.
    
    This plugin runs a simple background thread that logs messages periodically.
    """
    
    def __init__(self, plugin_info, global_config=None):
        """
        Initialize the example plugin.
        
        Args:
            plugin_info: Plugin descriptor information
            global_config: Global configuration dictionary
        """
        super().__init__(plugin_info, global_config)
        self.running = False
        self.paused = False
        self.thread = None
        self.counter = 0
        
        # Access custom config from the plugin descriptor
        self.config = plugin_info.get("config", {})
        self.logger.info(f"Example plugin config: {self.config}")
        
        # Access global configuration
        if self.global_config:
            dcs_folder = self.global_config.get('dcs_saved_games_folder', 'Not set')
            self.logger.info(f"DCS Saved Games Folder (from global config): {dcs_folder}")
    
    def on_start(self, loop: asyncio.AbstractEventLoop) -> bool:
        """
        Start the example plugin.
        
        Args:
            loop: The asyncio event loop to use for the plugin
        
        Returns:
            bool: True if started successfully
        """
        try:
            self.logger.info("Example plugin starting...")
            self.running = True
            self.paused = False
            self.counter = 0
            
            # Start background thread
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            
            self.logger.info("Example plugin started successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to start example plugin: {e}", exc_info=True)
            return False
    
    def on_stop(self) -> bool:
        """
        Stop the example plugin.
        
        Returns:
            bool: True if stopped successfully
        """
        try:
            self.logger.info("Example plugin stopping...")
            self.running = False
            
            # Wait for thread to finish
            if self.thread and self.thread.is_alive():
                self.thread.join(timeout=5.0)
            
            self.logger.info("Example plugin stopped successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop example plugin: {e}", exc_info=True)
            return False
    
    def on_pause(self) -> bool:
        """
        Pause the example plugin.
        
        Returns:
            bool: True if paused successfully
        """
        try:
            self.logger.info("Example plugin pausing...")
            self.paused = True
            self.logger.info("Example plugin paused successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to pause example plugin: {e}", exc_info=True)
            return False
    
    def on_resume(self) -> bool:
        """
        Resume the example plugin from pause.
        
        Returns:
            bool: True if resumed successfully
        """
        try:
            self.logger.info("Example plugin resuming...")
            self.paused = False
            self.logger.info("Example plugin resumed successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume example plugin: {e}", exc_info=True)
            return False
    
    def _run_loop(self):
        """
        Background thread loop for the plugin.
        This runs continuously while the plugin is active.
        """
        self.logger.info("Example plugin background loop started")
        
        while self.running:
            if not self.paused:
                self.counter += 1
                self.watchdog_tick()
                self.logger.info(f"Example plugin is running... (tick {self.counter})")
            else:
                self.logger.debug("Example plugin is paused")
            
            # Sleep for a bit
            time.sleep(5.0)
        
        self.logger.info("Example plugin background loop ended")
