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
import threading
import re
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote, parse_qs
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
        self.plugin_descriptors: Dict[str, Dict[str, Any]] = {}
        self.global_config = global_config or {}
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self._lock = threading.RLock()
        self._http_server: Optional[ThreadingHTTPServer] = None
        self._http_thread: Optional[threading.Thread] = None
        self._server_host: Optional[str] = None
        self._server_port: Optional[int] = None
        self.plugin_log_directory = Path("plugin_logs")
        self.plugin_log_paths: Dict[str, Path] = {}
        self._watchdog_enabled = True
        self._watchdog_check_interval = 5.0
        self._watchdog_timeout = 30.0
        self._watchdog_auto_restart = True
        self._watchdog_thread: Optional[threading.Thread] = None
        self._watchdog_stop_event = threading.Event()
        self._watchdog_restart_cooldown: Dict[str, float] = {}
        self._watchdog_last_check_time: float = 0.0
        self._watchdog_restart_count: Dict[str, int] = {}
        self._watchdog_last_restart_time: Dict[str, float] = {}
        self._watchdog_last_restart_success: Dict[str, bool] = {}
        self.logger = logging.getLogger("PluginManager")
        
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
        with self._lock:
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
        timeout_seconds: float = 30.0,
        auto_restart: bool = True
    ):
        """
        Configure plugin watchdog behavior.

        Args:
            enabled: Enable watchdog monitoring
            check_interval_seconds: Interval between watchdog checks
            timeout_seconds: Heartbeat timeout threshold
            auto_restart: Auto-restart crashed plugins
        """
        with self._lock:
            self._watchdog_enabled = bool(enabled)
            self._watchdog_check_interval = max(1.0, float(check_interval_seconds))
            self._watchdog_timeout = max(2.0, float(timeout_seconds))
            self._watchdog_auto_restart = bool(auto_restart)

    def start_watchdog(self) -> bool:
        """
        Start the watchdog monitoring thread.

        Returns:
            True when watchdog is running or disabled by config.
        """
        with self._lock:
            if not self._watchdog_enabled:
                self.logger.info("Watchdog is disabled by configuration")
                return True

            if self._watchdog_thread is not None and self._watchdog_thread.is_alive():
                return True

            self._watchdog_stop_event.clear()
            self._watchdog_thread = threading.Thread(
                target=self._watchdog_loop,
                name="PluginWatchdog",
                daemon=True
            )
            self._watchdog_thread.start()
            self.logger.info(
                "Watchdog started (check_interval=%ss, timeout=%ss, auto_restart=%s)",
                self._watchdog_check_interval,
                self._watchdog_timeout,
                self._watchdog_auto_restart
            )
            return True

    def stop_watchdog(self):
        """
        Stop the watchdog monitoring thread.
        """
        with self._lock:
            if self._watchdog_thread is None:
                return

            self._watchdog_stop_event.set()
            thread = self._watchdog_thread

        if thread.is_alive():
            thread.join(timeout=2.0)

        with self._lock:
            self._watchdog_thread = None

        self.logger.info("Watchdog stopped")

    def _watchdog_loop(self):
        """
        Periodically detect stale heartbeats for running plugins.
        """
        while not self._watchdog_stop_event.wait(self._watchdog_check_interval):
            stale_plugins: List[str] = []
            current_time = time.time()
            self._watchdog_last_check_time = current_time

            with self._lock:
                for name, plugin in self.plugins.items():
                    if plugin.get_status() != PluginStatus.RUNNING:
                        continue

                    state = plugin.get_watchdog_state()
                    last_heartbeat = float(state.get("last_heartbeat", 0.0) or 0.0)
                    if last_heartbeat <= 0:
                        continue

                    elapsed = current_time - last_heartbeat
                    if elapsed > self._watchdog_timeout:
                        stale_plugins.append(name)

            for plugin_name in stale_plugins:
                should_attempt_restart = False
                with self._lock:
                    cooldown_deadline = self._watchdog_restart_cooldown.get(plugin_name, 0.0)
                    if current_time >= cooldown_deadline:
                        self._watchdog_restart_cooldown[plugin_name] = current_time + self._watchdog_timeout
                        should_attempt_restart = True

                if not should_attempt_restart:
                    continue

                self.logger.error(
                    "Watchdog detected stale plugin heartbeat: %s (timeout %.1fs)",
                    plugin_name,
                    self._watchdog_timeout
                )

                if not self._watchdog_auto_restart:
                    continue

                self.logger.warning("Watchdog attempting auto-restart for plugin: %s", plugin_name)
                restarted = self.reload_plugin(plugin_name)
                with self._lock:
                    self._watchdog_restart_count[plugin_name] = self._watchdog_restart_count.get(plugin_name, 0) + 1
                    self._watchdog_last_restart_time[plugin_name] = time.time()
                    self._watchdog_last_restart_success[plugin_name] = restarted
                if restarted:
                    self.logger.info("Watchdog auto-restarted plugin: %s", plugin_name)
                else:
                    self.logger.error("Watchdog failed to auto-restart plugin: %s", plugin_name)

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

        restart_count = self._watchdog_restart_count.get(plugin_name, 0)
        last_restart_time = self._watchdog_last_restart_time.get(plugin_name)

        return {
            "enabled": self._watchdog_enabled,
            "running": self._watchdog_thread is not None and self._watchdog_thread.is_alive(),
            "check_interval_seconds": self._watchdog_check_interval,
            "timeout_seconds": self._watchdog_timeout,
            "auto_restart": self._watchdog_auto_restart,
            "last_check_timestamp": self._watchdog_last_check_time,
            "counter": counter,
            "last_heartbeat_timestamp": last_heartbeat,
            "heartbeat_age_seconds": heartbeat_age,
            "heartbeat_ticking": heartbeat_ticking,
            "auto_restart_count": restart_count,
            "last_auto_restart_timestamp": last_restart_time,
            "last_auto_restart_success": self._watchdog_last_restart_success.get(plugin_name)
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

        with self._lock:
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
        return loaded_count
    
    def start_plugin(self, plugin_name: str, loop: Optional[asyncio.AbstractEventLoop] = None) -> bool:
        """
        Start a specific plugin by name.
        
        Args:
            plugin_name: Name of the plugin to start
            
        Returns:
            True if started successfully, False otherwise
        """
        with self._lock:
            plugin = self.plugins.get(plugin_name)
            if not plugin:
                self.logger.error(f"Plugin not found: {plugin_name}")
                return False

            effective_loop = loop or self.loop
            if effective_loop is None:
                self.logger.error(f"Cannot start plugin {plugin_name}: event loop is not set")
                return False

            self.loop = effective_loop
            return plugin.start(effective_loop)

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        """
        Set the manager event loop used for plugin start operations.

        Args:
            loop: Asyncio event loop
        """
        with self._lock:
            self.loop = loop
    
    def stop_plugin(self, plugin_name: str) -> bool:
        """
        Stop a specific plugin by name.
        
        Args:
            plugin_name: Name of the plugin to stop
            
        Returns:
            True if stopped successfully, False otherwise
        """
        with self._lock:
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
        with self._lock:
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
        with self._lock:
            plugin = self.plugins.get(plugin_name)
            if not plugin:
                self.logger.error(f"Plugin not found: {plugin_name}")
                return False

            return plugin.resume()

    def reload_plugin(self, plugin_name: str) -> bool:
        """
        Reload a specific plugin by name.

        This stops the current instance (if loaded), loads a fresh instance
        from the descriptor, and restarts it if it was previously running.

        Args:
            plugin_name: Name of the plugin to reload

        Returns:
            True if reloaded successfully, False otherwise
        """
        with self._lock:
            existing_plugin = self.plugins.get(plugin_name)
            descriptor = self.plugin_descriptors.get(plugin_name)

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

            should_restart = False
            if existing_plugin is not None:
                existing_status = existing_plugin.get_status()
                should_restart = existing_status in (PluginStatus.RUNNING, PluginStatus.PAUSED)

                if existing_status != PluginStatus.STOPPED:
                    stop_ok = existing_plugin.stop()
                    if not stop_ok:
                        self.logger.warning(f"Plugin {plugin_name} did not stop cleanly before reload")

            new_plugin = self.load_plugin(descriptor)
            if new_plugin is None:
                self.logger.error(f"Reload failed while loading plugin: {plugin_name}")
                return False

            self.plugins[plugin_name] = new_plugin

            if should_restart:
                if self.loop is None:
                    self.logger.warning(
                        f"Plugin {plugin_name} reloaded but not restarted (event loop not set)"
                    )
                    return True

                return new_plugin.start(self.loop)

            return True
    
    def start_all_plugins(self, loop: asyncio.AbstractEventLoop) -> Dict[str, bool]:
        """
        Start all loaded plugins.
        
        Args:
            loop: The asyncio event loop to use for plugins
            
        Returns:
            Dictionary mapping plugin names to their start success status
        """
        results = {}
        with self._lock:
            self.loop = loop
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
        with self._lock:
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
        with self._lock:
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
        with self._lock:
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
        with self._lock:
            return self.plugins.get(plugin_name)
    
    def list_plugins(self) -> List[str]:
        """
        Get a list of all loaded plugin names.
        
        Returns:
            List of plugin names
        """
        with self._lock:
            return list(self.plugins.keys())

    def _build_web_dashboard_html(self) -> str:
        """
        Build the management dashboard HTML page.

        Returns:
            HTML string for the dashboard
        """
        return """<!doctype html>
<html lang=\"en\">
<head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>DCS Olympus Plugin Manager</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #111; color: #f5f5f5; }
        h1 { margin-bottom: 8px; }
        .hint { color: #aaa; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; background: #1b1b1b; }
        th, td { padding: 10px; border-bottom: 1px solid #2d2d2d; text-align: left; }
        th { background: #222; }
        .status { font-weight: bold; text-transform: uppercase; }
        .watchdog { font-family: Consolas, monospace; font-size: 12px; }
        button { margin-right: 8px; padding: 6px 12px; border: 0; border-radius: 4px; cursor: pointer; }
        .start { background: #2a9d5a; color: #fff; }
        .pause { background: #e8b100; color: #111; }
        .stop { background: #cf3b3b; color: #fff; }
        .reload { background: #2f7ad8; color: #fff; }
        .logs { background: #555; color: #fff; }
        #message { margin: 12px 0; min-height: 20px; color: #9bd18d; }
        #logs-panel { margin-top: 18px; padding: 12px; border: 1px solid #2d2d2d; background: #191919; }
        #logs-title { margin: 0 0 10px 0; }
        #logs-content {
            margin: 0;
            max-height: 320px;
            overflow: auto;
            background: #101010;
            border: 1px solid #2a2a2a;
            padding: 10px;
            font-family: Consolas, monospace;
            font-size: 12px;
            white-space: pre-wrap;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <h1>Plugin Manager</h1>
    <div class=\"hint\">Live view of active plugins. Updates every 2 seconds.</div>
    <div id=\"message\"></div>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Author</th>
                <th>Status</th>
                <th>Watchdog</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id=\"plugins\"></tbody>
    </table>

    <div id=\"logs-panel\">
        <h3 id=\"logs-title\">Plugin Logs</h3>
        <pre id=\"logs-content\">Click \"Logs\" for a plugin to view recent lines.</pre>
    </div>

    <script>
        const pluginsBody = document.getElementById('plugins');
        const message = document.getElementById('message');
        const logsTitle = document.getElementById('logs-title');
        const logsContent = document.getElementById('logs-content');
        let selectedLogPlugin = null;

        async function loadPlugins() {
            const response = await fetch('/api/plugins');
            const data = await response.json();
            const plugins = data.plugins || [];

            pluginsBody.innerHTML = '';

            for (const plugin of plugins) {
                const wd = plugin.watchdog_status || {};
                const heartbeatAge = wd.heartbeat_age_seconds;
                const heartbeatText = (heartbeatAge === null || heartbeatAge === undefined)
                    ? 'n/a'
                    : `${heartbeatAge.toFixed(1)}s`;
                const tickingText = wd.heartbeat_ticking ? 'ticking' : 'stale';
                const restartCount = wd.auto_restart_count || 0;
                const restartedText = restartCount > 0 ? `yes (${restartCount})` : 'no';
                const restartTs = wd.last_auto_restart_timestamp;
                const restartAt = restartTs ? new Date(restartTs * 1000).toLocaleTimeString() : 'n/a';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${plugin.name}</td>
                    <td>${plugin.version}</td>
                    <td>${plugin.author}</td>
                    <td class=\"status\">${plugin.status}</td>
                    <td class=\"watchdog\">${tickingText}<br/>heartbeat: ${heartbeatText}<br/>auto-restarted: ${restartedText}<br/>last restart: ${restartAt}</td>
                    <td>
                        <button class=\"start\" data-action=\"start\" data-name=\"${plugin.name}\">Start</button>
                        <button class=\"pause\" data-action=\"pause\" data-name=\"${plugin.name}\">Pause</button>
                        <button class=\"stop\" data-action=\"stop\" data-name=\"${plugin.name}\">Stop</button>
                        <button class=\"reload\" data-action=\"reload\" data-name=\"${plugin.name}\">Reload</button>
                        <button class=\"logs\" data-action=\"logs\" data-name=\"${plugin.name}\">Logs</button>
                    </td>
                `;
                pluginsBody.appendChild(tr);
            }
        }

        async function loadLogs(pluginName) {
            try {
                const response = await fetch(`/api/plugins/${encodeURIComponent(pluginName)}/logs?limit=300`);
                const result = await response.json();
                const lines = result.lines || [];
                logsTitle.textContent = `Plugin Logs: ${pluginName}`;
                logsContent.textContent = lines.length ? lines.join('\\n') : '(No logs yet)';
                logsContent.scrollTop = logsContent.scrollHeight;
            } catch (err) {
                logsTitle.textContent = `Plugin Logs: ${pluginName}`;
                logsContent.textContent = `Failed to load logs: ${err}`;
            }
        }

        async function sendAction(pluginName, action) {
            message.textContent = `${action} ${pluginName}...`;
            try {
                const response = await fetch(`/api/plugins/${encodeURIComponent(pluginName)}/${action}`, {
                    method: 'POST'
                });
                const result = await response.json();
                message.textContent = result.message || `${action} completed for ${pluginName}`;
            } catch (err) {
                message.textContent = `Request failed: ${err}`;
            }

            await loadPlugins();
        }

        document.body.addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const pluginName = button.dataset.name;
            const action = button.dataset.action;

            if (action === 'logs') {
                selectedLogPlugin = pluginName;
                await loadLogs(pluginName);
                return;
            }

            await sendAction(pluginName, action);

            if (selectedLogPlugin === pluginName) {
                await loadLogs(pluginName);
            }
        });

        loadPlugins();
        setInterval(async () => {
            await loadPlugins();
            if (selectedLogPlugin) {
                await loadLogs(selectedLogPlugin);
            }
        }, 2000);
    </script>
</body>
</html>
"""

    def start_management_server(self, host: str = "127.0.0.1", port: int = 8765) -> bool:
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
        with self._lock:
            if self._http_server is not None:
                self.logger.info(
                    f"Management server already running on {self._server_host}:{self._server_port}"
                )
                return True

            manager = self

            class ManagementRequestHandler(BaseHTTPRequestHandler):
                def _send_json(self, status_code: int, payload: Dict[str, Any]):
                    body = json.dumps(payload).encode("utf-8")
                    self.send_response(status_code)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)

                def _send_html(self, status_code: int, html: str):
                    body = html.encode("utf-8")
                    self.send_response(status_code)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)

                def _parse_api_path(self) -> List[str]:
                    parsed = urlparse(self.path)
                    return [segment for segment in parsed.path.split("/") if segment]

                def do_GET(self):
                    parts = self._parse_api_path()
                    parsed = urlparse(self.path)
                    query = parse_qs(parsed.query)

                    if len(parts) == 0:
                        self._send_html(200, manager._build_web_dashboard_html())
                        return

                    if len(parts) == 2 and parts[0] == "api" and parts[1] == "plugins":
                        plugins = list(manager.get_all_plugin_status().values())
                        self._send_json(200, {"plugins": plugins})
                        return

                    if len(parts) == 3 and parts[0] == "api" and parts[1] == "plugins":
                        plugin_name = unquote(parts[2])
                        plugin = manager.get_plugin(plugin_name)
                        if plugin is None:
                            self._send_json(404, {"error": f"Plugin not found: {plugin_name}"})
                            return

                        self._send_json(200, {"plugin": plugin.get_info()})
                        return

                    if len(parts) == 4 and parts[0] == "api" and parts[1] == "plugins" and parts[3] == "logs":
                        plugin_name = unquote(parts[2])
                        limit = 300
                        if "limit" in query:
                            try:
                                limit = int(query["limit"][0])
                            except (ValueError, IndexError):
                                limit = 300

                        lines = manager.get_plugin_logs(plugin_name, limit)
                        if lines is None:
                            self._send_json(404, {"error": f"Plugin not found: {plugin_name}"})
                            return

                        self._send_json(200, {"plugin": plugin_name, "lines": lines})
                        return

                    self._send_json(404, {"error": "Endpoint not found"})

                def do_POST(self):
                    parts = self._parse_api_path()

                    if len(parts) != 4 or parts[0] != "api" or parts[1] != "plugins":
                        self._send_json(404, {"error": "Endpoint not found"})
                        return

                    plugin_name = unquote(parts[2])
                    action = parts[3].lower()

                    if manager.get_plugin(plugin_name) is None:
                        self._send_json(404, {"error": f"Plugin not found: {plugin_name}"})
                        return

                    if action == "start":
                        success = manager.start_plugin(plugin_name)
                    elif action == "pause":
                        success = manager.pause_plugin(plugin_name)
                    elif action == "stop":
                        success = manager.stop_plugin(plugin_name)
                    elif action == "reload":
                        success = manager.reload_plugin(plugin_name)
                    else:
                        self._send_json(400, {"error": f"Unsupported action: {action}"})
                        return

                    if not success:
                        self._send_json(
                            400,
                            {
                                "success": False,
                                "message": f"Action '{action}' failed for plugin '{plugin_name}'"
                            }
                        )
                        return

                    plugin = manager.get_plugin(plugin_name)
                    status = plugin.get_info() if plugin else {"name": plugin_name, "status": "unknown"}
                    self._send_json(
                        200,
                        {
                            "success": True,
                            "message": f"Action '{action}' completed for plugin '{plugin_name}'",
                            "plugin": status
                        }
                    )

                def log_message(self, format: str, *args):
                    manager.logger.debug("HTTP %s - %s", self.address_string(), format % args)

            try:
                server = ThreadingHTTPServer((host, port), ManagementRequestHandler)
                thread = threading.Thread(
                    target=server.serve_forever,
                    name="PluginManagementServer",
                    daemon=True
                )
                thread.start()

                self._http_server = server
                self._http_thread = thread
                self._server_host = host
                self._server_port = port
                self.logger.info(f"Management server started at http://{host}:{port}")
                return True
            except Exception as e:
                self.logger.error(f"Failed to start management server: {e}", exc_info=True)
                self._http_server = None
                self._http_thread = None
                self._server_host = None
                self._server_port = None
                return False

    def stop_management_server(self):
        """
        Stop the embedded HTTP management server.
        """
        with self._lock:
            if self._http_server is None:
                return

            self._http_server.shutdown()
            self._http_server.server_close()

            if self._http_thread is not None and self._http_thread.is_alive():
                self._http_thread.join(timeout=2)

            self.logger.info("Management server stopped")
            self._http_server = None
            self._http_thread = None
            self._server_host = None
            self._server_port = None
