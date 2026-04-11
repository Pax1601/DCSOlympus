"""
Plugin Manager for DCS Olympus API.

Handles discovery, loading, and management of plugins.
"""

import asyncio
import os
import sys
import json
import importlib.util
import inspect
import logging
import re
import time
from collections import deque
from urllib.parse import urlparse, unquote, parse_qs
from typing import Dict, List, Optional, Any
from pathlib import Path

from api import API
from plugin_base import Plugin, PluginStatus


class PluginManager:
    """
    Manages the lifecycle of all plugins in the DCS Olympus API.
    
    Responsibilities:
    - Discover plugins in the plugins folder
    - Load plugin descriptors and main scripts
    - Start, stop, pause, and resume plugins
    - Track plugin status
    """
    
    def __init__(self, plugins_directory: str = "plugins", global_config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Plugin Manager.
        
        Args:
            plugins_directory: Path to the directory containing plugin folders
            global_config: Global configuration dictionary to pass to plugins
        """
        self.plugins_directory = Path(plugins_directory)
        self.plugins: Dict[str, Plugin] = {}
        self.plugin_descriptors: Dict[str, Dict[str, Any]] = {}
        self.global_config = global_config or {}
        self._http_server: Optional[asyncio.AbstractServer] = None
        self._server_host: Optional[str] = None
        self._server_port: Optional[int] = None
        self._dashboard_html_path = Path(__file__).with_name("plugin_dashboard.html")
        self.plugin_log_directory = Path("plugin_logs")
        self.plugin_log_paths: Dict[str, Path] = {}
        self._watchdog_enabled = True
        self._watchdog_check_interval = 5.0
        self._watchdog_timeout = 30.0
        self._watchdog_task: Optional[asyncio.Task] = None
        self._watchdog_stop_event = asyncio.Event()
        self._watchdog_last_check_time: float = 0.0
        self.logger = logging.getLogger("PluginManager")

        # Initialize the API to periodically check if the the DCS mission is running
        self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'), load_kokoro=False, load_whisper=False)

        self._should_auto_start_plugins = self.global_config.get('auto_start_plugins', True)
        self._running_plugins_on_mission_stop: List[str] = []
        
        # Create plugins directory if it doesn't exist
        if not self.plugins_directory.exists():
            self.plugins_directory.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"Created plugins directory: {self.plugins_directory}")

        if not self.plugin_log_directory.exists():
            self.plugin_log_directory.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"Created plugin log directory: {self.plugin_log_directory}")

    def _sanitize_plugin_filename(self, plugin_name: str) -> str:
        """
        Convert a plugin name to a filesystem-safe filename stem.

        Args:
            plugin_name: Plugin name

        Returns:
            Safe filename stem
        """
        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", plugin_name.strip())
        return safe_name or "plugin"

    def _get_plugin_log_path(self, plugin_name: str) -> Path:
        """
        Build the log file path for a plugin.

        Args:
            plugin_name: Plugin name

        Returns:
            Path to plugin log file
        """
        safe_name = self._sanitize_plugin_filename(plugin_name)
        return self.plugin_log_directory / f"{safe_name}.log"

    def _configure_plugin_logger(self, plugin: Plugin):
        """
        Ensure each plugin logger writes to its own dedicated log file.

        Args:
            plugin: Plugin instance
        """
        plugin_name = plugin.name
        plugin_logger = plugin.logger
        log_path = self._get_plugin_log_path(plugin_name)
        self.plugin_log_paths[plugin_name] = log_path

        target_path = os.path.normcase(os.path.abspath(str(log_path)))
        matched_handler: Optional[logging.FileHandler] = None
        duplicate_handlers: List[logging.FileHandler] = []

        for handler in plugin_logger.handlers:
            if not isinstance(handler, logging.FileHandler):
                continue

            existing_path = os.path.normcase(
                os.path.abspath(getattr(handler, "baseFilename", ""))
            )
            if existing_path == target_path:
                if matched_handler is None:
                    matched_handler = handler
                else:
                    duplicate_handlers.append(handler)

        for handler in duplicate_handlers:
            plugin_logger.removeHandler(handler)
            try:
                handler.close()
            except Exception:
                pass

        if matched_handler is not None:
            return

        file_handler = logging.FileHandler(log_path, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(
            logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        )
        plugin_logger.addHandler(file_handler)

    def get_plugin_logs(self, plugin_name: str, limit: int = 200) -> Optional[List[str]]:
        """
        Return the most recent log lines for a plugin.

        Args:
            plugin_name: Plugin name
            limit: Max number of trailing log lines

        Returns:
            List of log lines if available, None if plugin not found
        """
        if plugin_name not in self.plugins:
            return None

        path = self.plugin_log_paths.get(plugin_name)
        if path is None:
            path = self._get_plugin_log_path(plugin_name)
            self.plugin_log_paths[plugin_name] = path

        if not path.exists():
            return []

        max_lines = max(1, min(limit, 2000))

        try:
            tail = deque(maxlen=max_lines)
            with open(path, "r", encoding="utf-8", errors="replace") as handle:
                for line in handle:
                    tail.append(line.rstrip("\n"))
            return list(tail)
        except Exception as e:
            self.logger.error(f"Failed to read logs for plugin {plugin_name}: {e}", exc_info=True)
            return []

    def configure_watchdog(
        self,
        enabled: bool = True,
        check_interval_seconds: float = 5.0,
        timeout_seconds: float = 30.0
    ):
        """
        Configure plugin watchdog behavior.

        Args:
            enabled: Enable watchdog monitoring
            check_interval_seconds: Interval between watchdog checks
            timeout_seconds: Heartbeat timeout threshold
        """
        self._watchdog_enabled = bool(enabled)
        self._watchdog_check_interval = max(1.0, float(check_interval_seconds))
        self._watchdog_timeout = max(2.0, float(timeout_seconds))

    def start_watchdog(self) -> bool:
        """
        Start the watchdog monitoring task.

        Returns:
            True when watchdog is running or disabled by config.
        """
        if not self._watchdog_enabled:
            self.logger.info("Watchdog is disabled by configuration")
            return True

        if self._watchdog_task is not None and not self._watchdog_task.done():
            return True

        self._watchdog_stop_event.clear()
        self._watchdog_task = asyncio.create_task(self._watchdog_loop(), name="PluginWatchdog")
        self.logger.info(
            "Watchdog started (check_interval=%ss, timeout=%ss)",
            self._watchdog_check_interval,
            self._watchdog_timeout
        )
        return True

    async def stop_watchdog(self):
        """
        Stop the watchdog monitoring task.
        """
        if self._watchdog_task is None:
            return

        self._watchdog_stop_event.set()
        task = self._watchdog_task
        try:
            await asyncio.wait_for(task, timeout=2.0)
        except asyncio.TimeoutError:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        finally:
            self._watchdog_task = None

        self.logger.info("Watchdog stopped")

    def check_mission_started(self):
        result = self.api.update_mission()
        if not result:
            self.logger.info("Failed to check mission status via API")
            return False
        if result['dateAndTime']['elapsedTime'] < 30:
            self.logger.info("Mission elapsed time is less than 30 seconds, treating as not started")
            return False
        return True

    async def _watchdog_loop(self):
        """
        Periodically detect stale heartbeats for running plugins.
        """
        while True:
            try:
                await asyncio.wait_for(
                    self._watchdog_stop_event.wait(),
                    timeout=self._watchdog_check_interval,
                )
                break
            except asyncio.TimeoutError:
                pass

            stale_plugins: List[str] = []
            current_time = time.time()
            self._watchdog_last_check_time = current_time

            # ====== Mission Detection Logic ======
            if self.check_mission_started():
                # If the are plugins that were automatically stopped due to mission end, attempt to restart them now that a new mission has started
                if self._running_plugins_on_mission_stop:
                    self.logger.info(
                        "Mission detected. Attempting to restart %d plugin(s) that were stopped on mission end: %s",
                        len(self._running_plugins_on_mission_stop),
                        ", ".join(self._running_plugins_on_mission_stop)
                    )
                    for plugin_name in self._running_plugins_on_mission_stop:
                        if plugin_name in self.plugins and self.plugins[plugin_name].get_status() != PluginStatus.RUNNING:
                            await self.start_plugin(plugin_name)
                    self._running_plugins_on_mission_stop.clear()
            else:
                # Count the number of running plugins before stopping to avoid log spam
                running_plugins = [name for name, plugin in self.plugins.items() if plugin.get_status() == PluginStatus.RUNNING]

                if running_plugins:
                    self.logger.warning(
                        "No active mission detected. Stopping %d running plugin(s): %s",
                        len(running_plugins),
                        ", ".join(running_plugins)
                    )
                    self._running_plugins_on_mission_stop = running_plugins

                # Stop any plugin that is currently running
                for name, plugin in self.plugins.items():
                    if plugin.get_status() == PluginStatus.RUNNING:
                        self.logger.info(f"Mission not detected. Stopping plugin: {name}")
                        await self.stop_plugin(name)
                continue

            # ===== Stale Heartbeat Detection Logic =====
            for name, plugin in self.plugins.items():
                if plugin.get_status() != PluginStatus.RUNNING:
                    continue

                state = plugin.get_watchdog_state()
                last_heartbeat = float(state.get("last_heartbeat", 0.0) or 0.0)
                if last_heartbeat <= 0:
                    continue

                elapsed = current_time - last_heartbeat
                if elapsed > self._watchdog_timeout and plugin.get_status() == PluginStatus.RUNNING:
                    stale_plugins.append(name)

            for plugin_name in stale_plugins:
                self.logger.error(
                    "Watchdog detected stale plugin heartbeat: %s (timeout %.1fs)",
                    plugin_name,
                    self._watchdog_timeout
                )

                # Stop the plugin
                await self.stop_plugin(plugin_name)

    def _get_watchdog_plugin_status(self, plugin_name: str, plugin: Plugin) -> Dict[str, Any]:
        """
        Build watchdog status details for a plugin.

        Args:
            plugin_name: Plugin name
            plugin: Plugin instance

        Returns:
            Watchdog telemetry dictionary
        """
        now = time.time()
        raw_watchdog = plugin.get_watchdog_state()
        last_heartbeat = float(raw_watchdog.get("last_heartbeat", 0.0) or 0.0)
        counter = int(raw_watchdog.get("counter", 0) or 0)
        heartbeat_age = (now - last_heartbeat) if last_heartbeat > 0 else None

        heartbeat_ticking = False
        if plugin.get_status() == PluginStatus.RUNNING and heartbeat_age is not None:
            heartbeat_ticking = heartbeat_age <= self._watchdog_timeout

        return {
            "enabled": self._watchdog_enabled,
            "running": self._watchdog_task is not None and not self._watchdog_task.done(),
            "check_interval_seconds": self._watchdog_check_interval,
            "timeout_seconds": self._watchdog_timeout,
            "last_check_timestamp": self._watchdog_last_check_time,
            "counter": counter,
            "last_heartbeat_timestamp": last_heartbeat,
            "heartbeat_age_seconds": heartbeat_age,
            "heartbeat_ticking": heartbeat_ticking
        }
    
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
            self._configure_plugin_logger(plugin_instance)
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

        self.plugins.clear()
        self.plugin_descriptors.clear()

        for descriptor in descriptors:
            plugin_name = descriptor.get("name", "Unknown")
            plugin = self.load_plugin(descriptor)

            if plugin:
                self.plugins[plugin_name] = plugin
                self.plugin_descriptors[plugin_name] = descriptor
                loaded_count += 1
            else:
                self.logger.warning(f"Failed to load plugin: {plugin_name}")
        
        self.logger.info(f"Loaded {loaded_count} plugin(s)")

        # Initialize the list of plugins so that the watchdog will start them when a running mission is detected
        self._running_plugins_on_mission_stop = [name for name, plugin in self.plugins.items() if plugin.get_info().get("enabled", True)]

        return loaded_count
    
    async def start_plugin(self, plugin_name: str) -> bool:
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

        return await self._invoke_plugin_action(plugin_name, "start", plugin.start)
    
    async def stop_plugin(self, plugin_name: str) -> bool:
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

        return await self._invoke_plugin_action(plugin_name, "stop", plugin.stop)
    
    async def pause_plugin(self, plugin_name: str) -> bool:
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

        return await self._invoke_plugin_action(plugin_name, "pause", plugin.pause)
    
    async def resume_plugin(self, plugin_name: str) -> bool:
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

        return await self._invoke_plugin_action(plugin_name, "resume", plugin.resume)

    async def _invoke_plugin_action(self, plugin_name: str, action: str, callback) -> bool:
        """
        Execute a plugin lifecycle action on the active event loop.
        """
        try:
            result = callback()
            if inspect.isawaitable(result):
                result = await result
            return bool(result)
        except Exception as e:
            self.logger.error(
                "Failed to %s plugin %s: %s",
                action,
                plugin_name,
                e,
                exc_info=True,
            )
            return False
        
    def reload_plugin_descriptor(self, plugin_name: str) -> Optional[Dict[str, Any]]:
        """
        Reload the plugin descriptor from disk.

        Args:
            plugin_name: Name of the plugin
        Returns:
            Updated plugin descriptor if successful, None otherwise
        """
        descriptor = self.plugin_descriptors.get(plugin_name)
        if descriptor is None:
            return None

        descriptor_path = descriptor.get("_descriptor_path")
        if not descriptor_path or not os.path.exists(descriptor_path):
            self.logger.error(f"Descriptor file not found for plugin {plugin_name}: {descriptor_path}")
            return None

        try:
            with open(descriptor_path, 'r', encoding='utf-8') as f:
                updated_descriptor = json.load(f)
            updated_descriptor["_plugin_dir"] = descriptor.get("_plugin_dir")
            updated_descriptor["_descriptor_path"] = descriptor_path
            updated_descriptor["_main_script_path"] = descriptor.get("_main_script_path")
            self.plugin_descriptors[plugin_name] = updated_descriptor
            return updated_descriptor
        except Exception as e:
            self.logger.error(f"Failed to reload descriptor for plugin {plugin_name}: {e}", exc_info=True)
            return None

    def reload_plugin(self, plugin_name: str) -> bool:
        """
        Reload a specific plugin by name.

        Reload is only allowed when the plugin is currently STOPPED.

        Args:
            plugin_name: Name of the plugin to reload

        Returns:
            True if reloaded successfully, False otherwise
        """
        existing_plugin = self.plugins.get(plugin_name)

        # Reload the plugin descriptor in case it was modified since initial load
        descriptor = self.reload_plugin_descriptor(plugin_name)

        if descriptor is None:
            # Re-discover in case the plugin was added/renamed after startup
            for discovered in self.discover_plugins():
                if discovered.get("name") == plugin_name:
                    descriptor = discovered
                    self.plugin_descriptors[plugin_name] = discovered
                    break

        if descriptor is None:
            self.logger.error(f"Plugin descriptor not found for reload: {plugin_name}")
            return False

        if existing_plugin is not None:
            existing_status = existing_plugin.get_status()
            if existing_status != PluginStatus.STOPPED:
                self.logger.warning(
                    f"Reload denied for plugin {plugin_name}: plugin must be stopped first (current status={existing_status.value})"
                )
                return False

        new_plugin = self.load_plugin(descriptor)
        if new_plugin is None:
            self.logger.error(f"Reload failed while loading plugin: {plugin_name}")
            return False

        self.plugins[plugin_name] = new_plugin
        return True
    
    async def start_all_plugins(self) -> Dict[str, bool]:
        """
        Start all loaded plugins.
        
        Args:
            loop: The asyncio event loop to use for plugins
            
        Returns:
            Dictionary mapping plugin names to their start success status
        """
        results = {}
        plugin_entries = [(name, plugin.get_info().get("enabled", True)) for name, plugin in self.plugins.items()]

        for name, enabled in plugin_entries:
            if enabled:
                results[name] = await self.start_plugin(name)
            else:
                self.logger.info(f"Plugin {name} is disabled and will not be started")
                results[name] = False

        return results
    
    async def stop_all_plugins(self) -> Dict[str, bool]:
        """
        Stop all running plugins.
        
        Returns:
            Dictionary mapping plugin names to their stop success status
        """
        results = {}
        plugin_names = list(self.plugins.keys())

        for name in plugin_names:
            results[name] = await self.stop_plugin(name)

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
            info = plugin.get_info()
            info["watchdog_status"] = self._get_watchdog_plugin_status(name, plugin)
            status_dict[name] = info
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

    def _build_web_dashboard_html(self) -> str:
        """
        Build the management dashboard HTML page.

        Returns:
            HTML string for the dashboard
        """
        try:
            return self._dashboard_html_path.read_text(encoding="utf-8")
        except Exception as e:
            self.logger.error("Failed to load dashboard HTML template: %s", e, exc_info=True)
            return """<!doctype html>
<html lang=\"en\">
<head>
    <meta charset=\"utf-8\" />
    <title>DCS Olympus Plugin Manager</title>
</head>
<body>
    <h1>Plugin Manager</h1>
    <p>Dashboard template is unavailable. Check logs for details.</p>
</body>
</html>
"""

    async def start_management_server(self, host: str = "127.0.0.1", port: int = 8765) -> bool:
        """
        Start an embedded HTTP management server.

        Endpoints:
        - GET /                    -> web dashboard
        - GET /api/plugins         -> all plugins and statuses
        - GET /api/plugins/<name>  -> single plugin info
        - GET /api/plugins/<name>/logs?limit=300
        - POST /api/plugins/<name>/start
        - POST /api/plugins/<name>/pause
        - POST /api/plugins/<name>/stop
        - POST /api/plugins/<name>/reload

        Args:
            host: Bind host
            port: Bind port

        Returns:
            True if started successfully, False otherwise
        """
        if self._http_server is not None:
            self.logger.info(
                f"Management server already running on {self._server_host}:{self._server_port}"
            )
            return True

        try:
            self._http_server = await asyncio.start_server(self._handle_management_client, host, port)
            self._server_host = host
            self._server_port = port
            self.logger.info(f"Management server started at http://{host}:{port}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to start management server: {e}", exc_info=True)
            self._http_server = None
            self._server_host = None
            self._server_port = None
            return False

    async def _send_http_response(
        self,
        writer: asyncio.StreamWriter,
        status_code: int,
        content_type: str,
        body: bytes,
    ):
        reason_phrases = {
            200: "OK",
            400: "Bad Request",
            404: "Not Found",
            405: "Method Not Allowed",
            500: "Internal Server Error",
        }
        reason = reason_phrases.get(status_code, "OK")
        headers = [
            f"HTTP/1.1 {status_code} {reason}",
            f"Content-Type: {content_type}",
            f"Content-Length: {len(body)}",
            "Connection: close",
            "",
            "",
        ]
        writer.write("\r\n".join(headers).encode("utf-8") + body)
        await writer.drain()

    async def _send_json_response(self, writer: asyncio.StreamWriter, status_code: int, payload: Dict[str, Any]):
        body = json.dumps(payload).encode("utf-8")
        await self._send_http_response(writer, status_code, "application/json; charset=utf-8", body)

    async def _send_html_response(self, writer: asyncio.StreamWriter, status_code: int, html: str):
        await self._send_http_response(writer, status_code, "text/html; charset=utf-8", html.encode("utf-8"))

    async def _handle_management_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer = writer.get_extra_info("peername")
        try:
            request_line = await reader.readline()
            if not request_line:
                writer.close()
                await writer.wait_closed()
                return

            parts = request_line.decode("utf-8", errors="replace").strip().split(" ")
            if len(parts) < 2:
                await self._send_json_response(writer, 400, {"error": "Malformed request line"})
                writer.close()
                await writer.wait_closed()
                return

            method = parts[0].upper()
            target = parts[1]

            # Consume headers. We do not currently need request headers/body.
            while True:
                header_line = await reader.readline()
                if not header_line or header_line in (b"\r\n", b"\n"):
                    break

            parsed = urlparse(target)
            route = [segment for segment in parsed.path.split("/") if segment]
            query = parse_qs(parsed.query)

            if method == "GET":
                if len(route) == 0:
                    await self._send_html_response(writer, 200, self._build_web_dashboard_html())
                elif len(route) == 2 and route[0] == "api" and route[1] == "plugins":
                    plugins = list(self.get_all_plugin_status().values())
                    await self._send_json_response(writer, 200, {"plugins": plugins})
                elif len(route) == 3 and route[0] == "api" and route[1] == "plugins":
                    plugin_name = unquote(route[2])
                    plugin = self.get_plugin(plugin_name)
                    if plugin is None:
                        await self._send_json_response(writer, 404, {"error": f"Plugin not found: {plugin_name}"})
                    else:
                        await self._send_json_response(writer, 200, {"plugin": plugin.get_info()})
                elif len(route) == 4 and route[0] == "api" and route[1] == "plugins" and route[3] == "logs":
                    plugin_name = unquote(route[2])
                    limit = 300
                    if "limit" in query:
                        try:
                            limit = int(query["limit"][0])
                        except (ValueError, IndexError):
                            limit = 300

                    lines = self.get_plugin_logs(plugin_name, limit)
                    if lines is None:
                        await self._send_json_response(writer, 404, {"error": f"Plugin not found: {plugin_name}"})
                    else:
                        await self._send_json_response(writer, 200, {"plugin": plugin_name, "lines": lines})
                else:
                    await self._send_json_response(writer, 404, {"error": "Endpoint not found"})

            elif method == "POST":
                if len(route) != 4 or route[0] != "api" or route[1] != "plugins":
                    await self._send_json_response(writer, 404, {"error": "Endpoint not found"})
                else:
                    plugin_name = unquote(route[2])
                    action = route[3].lower()

                    if self.get_plugin(plugin_name) is None:
                        await self._send_json_response(writer, 404, {"error": f"Plugin not found: {plugin_name}"})
                    else:
                        if action == "start":
                            success = await self.start_plugin(plugin_name)
                        elif action == "pause":
                            success = await self.pause_plugin(plugin_name)
                        elif action == "stop":
                            success = await self.stop_plugin(plugin_name)
                        elif action == "reload":
                            status = self.get_plugin_status(plugin_name)
                            if status is not PluginStatus.STOPPED:
                                await self._send_json_response(
                                    writer,
                                    400,
                                    {
                                        "success": False,
                                        "message": f"Action 'reload' failed for plugin '{plugin_name}': stop the plugin first"
                                    }
                                )
                                writer.close()
                                await writer.wait_closed()
                                return
                            success = self.reload_plugin(plugin_name)
                        else:
                            await self._send_json_response(writer, 400, {"error": f"Unsupported action: {action}"})
                            writer.close()
                            await writer.wait_closed()
                            return

                        if not success:
                            await self._send_json_response(
                                writer,
                                400,
                                {
                                    "success": False,
                                    "message": f"Action '{action}' failed for plugin '{plugin_name}'"
                                }
                            )
                        else:
                            plugin = self.get_plugin(plugin_name)
                            status = plugin.get_info() if plugin else {"name": plugin_name, "status": "unknown"}
                            await self._send_json_response(
                                writer,
                                200,
                                {
                                    "success": True,
                                    "message": f"Action '{action}' completed for plugin '{plugin_name}'",
                                    "plugin": status
                                }
                            )
            else:
                await self._send_json_response(writer, 405, {"error": f"Unsupported method: {method}"})
        except Exception as e:
            self.logger.error("HTTP request handling failed: %s", e, exc_info=True)
            try:
                await self._send_json_response(writer, 500, {"error": "Internal server error"})
            except Exception:
                pass
        finally:
            if peer is not None:
                self.logger.debug("HTTP %s served", peer)
            writer.close()
            await writer.wait_closed()

    async def stop_management_server(self):
        """
        Stop the embedded HTTP management server.
        """
        if self._http_server is None:
            return

        self._http_server.close()
        await self._http_server.wait_closed()
        self.logger.info("Management server stopped")
        self._http_server = None
        self._server_host = None
        self._server_port = None
