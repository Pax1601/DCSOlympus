"""
Base Plugin class for DCS Olympus API plugins.

All plugins must inherit from this class and implement the required methods.
"""

from abc import ABC, abstractmethod
import asyncio
from enum import Enum
from typing import Dict, Any, Optional
import logging
import threading
import time


class PluginStatus(Enum):
    """Enumeration of possible plugin states."""
    INITIALIZED = "initialized"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"


class Plugin(ABC):
    """
    Abstract base class for all DCS Olympus plugins.
    
    Plugins must inherit from this class and implement the abstract methods:
    - on_start(): Called when the plugin should start its operation
    - on_stop(): Called when the plugin should stop
    - on_pause(): Called when the plugin should pause
    - on_resume(): Called when the plugin should resume from pause
    """
    
    def __init__(self, plugin_info: Dict[str, Any], global_config: Optional[Dict[str, Any]] = None):
        """
        Initialize the plugin with its descriptor information.
        
        Args:
            plugin_info: Dictionary containing plugin metadata from .json descriptor
            global_config: Global configuration dictionary from ConfigManager
        """
        self.plugin_info = plugin_info
        self.global_config = global_config or {}
        self.name = plugin_info.get("name", "Unknown Plugin")
        self.version = plugin_info.get("version", "0.0.0")
        self.author = plugin_info.get("author", "Unknown")
        self.description = plugin_info.get("description", "")
        self.status = PluginStatus.INITIALIZED
        self.logger = logging.getLogger(f"Plugin.{self.name}")
        self._watchdog_lock = threading.Lock()
        self._watchdog_counter = 0
        self._watchdog_last_heartbeat = 0.0

    def watchdog_tick(self):
        """
        Increment the watchdog heartbeat counter for this plugin.

        Plugins should call this method periodically while running.
        """
        with self._watchdog_lock:
            self._watchdog_counter += 1
            self._watchdog_last_heartbeat = time.time()

    def get_watchdog_state(self) -> Dict[str, Any]:
        """
        Return current watchdog state for this plugin.

        Returns:
            Dictionary with watchdog counter and last heartbeat timestamp.
        """
        with self._watchdog_lock:
            return {
                "counter": self._watchdog_counter,
                "last_heartbeat": self._watchdog_last_heartbeat
            }
        
    @abstractmethod
    def on_start(self, loop: asyncio.AbstractEventLoop) -> bool:
        """
        Called when the plugin should start its operation.
        
        Args:
            loop: The asyncio event loop to use for the plugin
        
        Returns:
            bool: True if started successfully, False otherwise
        """
        pass
    
    @abstractmethod
    def on_stop(self) -> bool:
        """
        Called when the plugin should stop.
        
        Returns:
            bool: True if stopped successfully, False otherwise
        """
        pass
    
    @abstractmethod
    def on_pause(self) -> bool:
        """
        Called when the plugin should pause its operation.
        
        Returns:
            bool: True if paused successfully, False otherwise
        """
        pass
    
    @abstractmethod
    def on_resume(self) -> bool:
        """
        Called when the plugin should resume from pause.
        
        Returns:
            bool: True if resumed successfully, False otherwise
        """
        pass
    
    def start(self, loop: asyncio.AbstractEventLoop) -> bool:
        """
        Start the plugin. Calls on_start() and updates status.
        
        Args:
            loop: The asyncio event loop to use for the plugin
        
        Returns:
            bool: True if started successfully, False otherwise
        """
        if self.status == PluginStatus.RUNNING:
            self.logger.warning(f"Plugin {self.name} is already running")
            return True
            
        try:
            self.logger.info(f"Starting plugin: {self.name}")
            result = self.on_start(loop)
            if result:
                self.status = PluginStatus.RUNNING
                self.watchdog_tick()
                self.logger.info(f"Plugin {self.name} started successfully")
            else:
                self.status = PluginStatus.ERROR
                self.logger.error(f"Plugin {self.name} failed to start")
            return result
        except Exception as e:
            self.logger.error(f"Error starting plugin {self.name}: {e}", exc_info=True)
            self.status = PluginStatus.ERROR
            return False
    
    def stop(self) -> bool:
        """
        Stop the plugin. Calls on_stop() and updates status.
        
        Returns:
            bool: True if stopped successfully, False otherwise
        """
        if self.status == PluginStatus.STOPPED:
            self.logger.warning(f"Plugin {self.name} is already stopped")
            return True
            
        try:
            self.logger.info(f"Stopping plugin: {self.name}")
            result = self.on_stop()
            if result:
                self.status = PluginStatus.STOPPED
                self.logger.info(f"Plugin {self.name} stopped successfully")
            else:
                self.logger.error(f"Plugin {self.name} failed to stop cleanly")
            return result
        except Exception as e:
            self.logger.error(f"Error stopping plugin {self.name}: {e}", exc_info=True)
            self.status = PluginStatus.ERROR
            return False
    
    def pause(self) -> bool:
        """
        Pause the plugin. Calls on_pause() and updates status.
        
        Returns:
            bool: True if paused successfully, False otherwise
        """
        if self.status != PluginStatus.RUNNING:
            self.logger.warning(f"Plugin {self.name} is not running, cannot pause")
            return False
            
        try:
            self.logger.info(f"Pausing plugin: {self.name}")
            result = self.on_pause()
            if result:
                self.status = PluginStatus.PAUSED
                self.logger.info(f"Plugin {self.name} paused successfully")
            else:
                self.logger.error(f"Plugin {self.name} failed to pause")
            return result
        except Exception as e:
            self.logger.error(f"Error pausing plugin {self.name}: {e}", exc_info=True)
            self.status = PluginStatus.ERROR
            return False
    
    def resume(self) -> bool:
        """
        Resume the plugin from pause. Calls on_resume() and updates status.
        
        Returns:
            bool: True if resumed successfully, False otherwise
        """
        if self.status != PluginStatus.PAUSED:
            self.logger.warning(f"Plugin {self.name} is not paused, cannot resume")
            return False
            
        try:
            self.logger.info(f"Resuming plugin: {self.name}")
            result = self.on_resume()
            if result:
                self.status = PluginStatus.RUNNING
                self.watchdog_tick()
                self.logger.info(f"Plugin {self.name} resumed successfully")
            else:
                self.logger.error(f"Plugin {self.name} failed to resume")
            return result
        except Exception as e:
            self.logger.error(f"Error resuming plugin {self.name}: {e}", exc_info=True)
            self.status = PluginStatus.ERROR
            return False
    
    def get_status(self) -> PluginStatus:
        """
        Get the current status of the plugin.
        
        Returns:
            PluginStatus: Current status of the plugin
        """
        return self.status
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get information about the plugin.
        
        Returns:
            dict: Plugin information including name, version, author, status, etc.
        """
        return {
            "name": self.name,
            "version": self.version,
            "author": self.author,
            "description": self.description,
            "status": self.status.value,
            "watchdog": self.get_watchdog_state(),
            "info": self.plugin_info
        }
