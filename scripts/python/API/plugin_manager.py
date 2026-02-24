"""
Plugin Manager for DCS Olympus API.

Handles discovery, loading, and management of plugins.
"""

import asyncio
import os
import sys
import json
import importlib.util
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path

from plugin_base import Plugin, PluginStatus


class PluginManager:
    """
    Manages the lifecycle of all plugins in the DCS Olympus API.
    
    Responsibilities:
    - Discover plugins in the scripts folder
    - Load plugin descriptors and main scripts
    - Start, stop, pause, and resume plugins
    - Track plugin status
    """
    
    def __init__(self, plugins_directory: str = "scripts", global_config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Plugin Manager.
        
        Args:
            plugins_directory: Path to the directory containing plugin folders
            global_config: Global configuration dictionary to pass to plugins
        """
        self.plugins_directory = Path(plugins_directory)
        self.plugins: Dict[str, Plugin] = {}
        self.global_config = global_config or {}
        self.logger = logging.getLogger("PluginManager")
        
        # Create plugins directory if it doesn't exist
        if not self.plugins_directory.exists():
            self.plugins_directory.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"Created plugins directory: {self.plugins_directory}")
    
    def discover_plugins(self) -> List[Dict[str, Any]]:
        """
        Discover all plugins in the plugins directory.
        
        A valid plugin must have:
        - A .json descriptor file
        - A main.py file (or file specified in descriptor)
        
        Returns:
            List of plugin descriptors found
        """
        discovered = []
        
        if not self.plugins_directory.exists():
            self.logger.warning(f"Plugins directory does not exist: {self.plugins_directory}")
            return discovered
        
        self.logger.info(f"Discovering plugins in: {self.plugins_directory}")
        
        # Iterate through each subdirectory in the plugins folder
        for item in self.plugins_directory.iterdir():
            if not item.is_dir():
                continue
            
            plugin_name = item.name
            self.logger.debug(f"Checking directory: {plugin_name}")
            
            # Look for .json descriptor file
            json_files = list(item.glob("*.json"))
            
            if not json_files:
                self.logger.debug(f"No .json descriptor found in {plugin_name}")
                continue
            
            # Use the first .json file found
            descriptor_path = json_files[0]
            
            try:
                with open(descriptor_path, 'r', encoding='utf-8') as f:
                    descriptor = json.load(f)
                
                # Validate descriptor has required fields
                if "name" not in descriptor:
                    descriptor["name"] = plugin_name
                
                # Determine the main script file
                main_script = descriptor.get("main", "main.py")
                main_script_path = item / main_script
                
                if not main_script_path.exists():
                    self.logger.warning(f"Main script not found for plugin {plugin_name}: {main_script_path}")
                    continue
                
                # Add paths to descriptor
                descriptor["_plugin_dir"] = str(item)
                descriptor["_descriptor_path"] = str(descriptor_path)
                descriptor["_main_script_path"] = str(main_script_path)
                
                discovered.append(descriptor)
                self.logger.info(f"Discovered plugin: {descriptor['name']} v{descriptor.get('version', 'unknown')}")
                
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse descriptor for {plugin_name}: {e}")
            except Exception as e:
                self.logger.error(f"Error processing plugin {plugin_name}: {e}", exc_info=True)
        
        self.logger.info(f"Discovery complete. Found {len(discovered)} plugin(s)")
        return discovered
    
    def load_plugin(self, descriptor: Dict[str, Any]) -> Optional[Plugin]:
        """
        Load a single plugin from its descriptor.
        
        Args:
            descriptor: Plugin descriptor dictionary
            
        Returns:
            Plugin instance if loaded successfully, None otherwise
        """
        plugin_name = descriptor.get("name", "Unknown")
        main_script_path = descriptor.get("_main_script_path")
        plugin_dir = descriptor.get("_plugin_dir")
        
        if not main_script_path or not os.path.exists(main_script_path):
            self.logger.error(f"Main script not found for plugin {plugin_name}")
            return None
        
        try:
            # Add plugin directory to sys.path so the plugin can import local modules
            if plugin_dir and plugin_dir not in sys.path:
                sys.path.insert(0, plugin_dir)
            
            # Load the module
            spec = importlib.util.spec_from_file_location(
                f"plugin_{plugin_name}",
                main_script_path
            )
            
            if spec is None or spec.loader is None:
                self.logger.error(f"Failed to create module spec for {plugin_name}")
                return None
            
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            spec.loader.exec_module(module)
            
            # Look for a class that inherits from Plugin
            plugin_class = None
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (isinstance(attr, type) and 
                    issubclass(attr, Plugin) and 
                    attr is not Plugin):
                    plugin_class = attr
                    break
            
            if plugin_class is None:
                self.logger.error(f"No Plugin subclass found in {plugin_name}")
                return None
            
            # Instantiate the plugin with global config
            plugin_instance = plugin_class(descriptor, self.global_config)
            self.logger.info(f"Loaded plugin: {plugin_name}")
            
            return plugin_instance
            
        except Exception as e:
            self.logger.error(f"Failed to load plugin {plugin_name}: {e}", exc_info=True)
            return None
    
    def load_all_plugins(self) -> int:
        """
        Discover and load all plugins.
        
        Returns:
            Number of plugins successfully loaded
        """
        descriptors = self.discover_plugins()
        loaded_count = 0
        
        for descriptor in descriptors:
            plugin_name = descriptor.get("name", "Unknown")
            plugin = self.load_plugin(descriptor)
            
            if plugin:
                self.plugins[plugin_name] = plugin
                loaded_count += 1
            else:
                self.logger.warning(f"Failed to load plugin: {plugin_name}")
        
        self.logger.info(f"Loaded {loaded_count} plugin(s)")
        return loaded_count
    
    def start_plugin(self, plugin_name: str) -> bool:
        """
        Start a specific plugin by name.
        
        Args:
            plugin_name: Name of the plugin to start
            
        Returns:
            True if started successfully, False otherwise
        """
        plugin = self.plugins.get(plugin_name)
        if not plugin:
            self.logger.error(f"Plugin not found: {plugin_name}")
            return False
        
        return plugin.start()
    
    def stop_plugin(self, plugin_name: str) -> bool:
        """
        Stop a specific plugin by name.
        
        Args:
            plugin_name: Name of the plugin to stop
            
        Returns:
            True if stopped successfully, False otherwise
        """
        plugin = self.plugins.get(plugin_name)
        if not plugin:
            self.logger.error(f"Plugin not found: {plugin_name}")
            return False
        
        return plugin.stop()
    
    def pause_plugin(self, plugin_name: str) -> bool:
        """
        Pause a specific plugin by name.
        
        Args:
            plugin_name: Name of the plugin to pause
            
        Returns:
            True if paused successfully, False otherwise
        """
        plugin = self.plugins.get(plugin_name)
        if not plugin:
            self.logger.error(f"Plugin not found: {plugin_name}")
            return False
        
        return plugin.pause()
    
    def resume_plugin(self, plugin_name: str) -> bool:
        """
        Resume a specific plugin by name.
        
        Args:
            plugin_name: Name of the plugin to resume
            
        Returns:
            True if resumed successfully, False otherwise
        """
        plugin = self.plugins.get(plugin_name)
        if not plugin:
            self.logger.error(f"Plugin not found: {plugin_name}")
            return False
        
        return plugin.resume()
    
    def start_all_plugins(self, loop: asyncio.AbstractEventLoop) -> Dict[str, bool]:
        """
        Start all loaded plugins.
        
        Args:
            loop: The asyncio event loop to use for plugins
            
        Returns:
            Dictionary mapping plugin names to their start success status
        """
        results = {}
        for name, plugin in self.plugins.items():
            results[name] = plugin.start(loop)
        return results
    
    def stop_all_plugins(self) -> Dict[str, bool]:
        """
        Stop all running plugins.
        
        Returns:
            Dictionary mapping plugin names to their stop success status
        """
        results = {}
        for name, plugin in self.plugins.items():
            results[name] = plugin.stop()
        return results
    
    def get_plugin_status(self, plugin_name: str) -> Optional[PluginStatus]:
        """
        Get the status of a specific plugin.
        
        Args:
            plugin_name: Name of the plugin
            
        Returns:
            PluginStatus if plugin exists, None otherwise
        """
        plugin = self.plugins.get(plugin_name)
        if not plugin:
            return None
        return plugin.get_status()
    
    def get_all_plugin_status(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status and information for all plugins.
        
        Returns:
            Dictionary mapping plugin names to their info dictionaries
        """
        status_dict = {}
        for name, plugin in self.plugins.items():
            status_dict[name] = plugin.get_info()
        return status_dict
    
    def get_plugin(self, plugin_name: str) -> Optional[Plugin]:
        """
        Get a plugin instance by name.
        
        Args:
            plugin_name: Name of the plugin
            
        Returns:
            Plugin instance if found, None otherwise
        """
        return self.plugins.get(plugin_name)
    
    def list_plugins(self) -> List[str]:
        """
        Get a list of all loaded plugin names.
        
        Returns:
            List of plugin names
        """
        return list(self.plugins.keys())
