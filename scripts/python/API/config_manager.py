"""
Configuration Manager for DCS Olympus Plugin Manager.

Handles loading, creating, and managing configuration files.
"""

import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional


class ConfigManager:
    """
    Manages configuration for the DCS Olympus Plugin Manager.
    
    Features:
    - Load configuration from file
    - Create default configuration if missing
    - Validate configuration structure
    - Provide configuration to plugins
    """
    
    DEFAULT_CONFIG = {
        "version": "1.0",
        "dcs_saved_games_folder": "",
        "plugins_directory": "scripts",
        "log_level": "INFO",
        "auto_start_plugins": True,
        "management_server": {
            "enabled": True,
            "host": "127.0.0.1",
            "port": 8765
        },
        "watchdog": {
            "enabled": True,
            "check_interval_seconds": 5,
            "timeout_seconds": 30,
            "auto_restart": True
        },
        "plugin_settings": {
            "example": "Configuration for specific plugins can go here"
        }
    }
    
    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize the Configuration Manager.
        
        Args:
            config_path: Path to the configuration file. If None, uses default location.
        """
        self.logger = logging.getLogger("ConfigManager")
        
        # Determine config file path
        if config_path is None:
            self.config_path = Path("plugin_manager_config.json")
        else:
            self.config_path = Path(config_path)
        
        self.config: Dict[str, Any] = {}
        self._load_or_create_config()
    
    def _load_or_create_config(self):
        """
        Load configuration from file or create default if it doesn't exist.
        """
        if self.config_path.exists():
            self._load_config()
        else:
            self.logger.warning(f"Configuration file not found: {self.config_path}")
            self._create_default_config()
            self._load_config()
    
    def _load_config(self):
        """
        Load configuration from the config file.
        """
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            
            self.logger.info(f"Configuration loaded from: {self.config_path}")
            
            # Validate and apply defaults for missing keys
            self._apply_defaults()
            
            # Log important settings
            dcs_folder = self.config.get('dcs_saved_games_folder', 'Not set')
            plugins_dir = self.config.get('plugins_directory', 'scripts')
            self.logger.info(f"DCS Saved Games Folder: {dcs_folder if dcs_folder else 'Not configured'}")
            self.logger.info(f"Plugins Directory: {plugins_dir}")
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse configuration file: {e}")
            self.logger.warning("Using default configuration")
            self.config = self.DEFAULT_CONFIG.copy()
        except Exception as e:
            self.logger.error(f"Error loading configuration: {e}")
            self.logger.warning("Using default configuration")
            self.config = self.DEFAULT_CONFIG.copy()
    
    def _create_default_config(self):
        """
        Create a default configuration file.
        """
        try:
            self.logger.info(f"Creating default configuration file: {self.config_path}")
            
            # Try to detect DCS Saved Games folder
            detected_path = self._detect_dcs_saved_games()
            if detected_path:
                self.DEFAULT_CONFIG['dcs_saved_games_folder'] = str(detected_path)
                self.logger.info(f"Auto-detected DCS Saved Games folder: {detected_path}")
            
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.DEFAULT_CONFIG, f, indent=2)
            
            self.logger.info("Default configuration file created successfully")
            self.logger.warning("Please review and update the configuration file with your settings")
            
        except Exception as e:
            self.logger.error(f"Failed to create default configuration file: {e}")
    
    def _detect_dcs_saved_games(self) -> Optional[Path]:
        """
        Attempt to auto-detect the DCS Saved Games folder.
        
        Returns:
            Path to DCS Saved Games folder if found, None otherwise
        """
        try:
            # Common Windows locations
            user_profile = Path(os.environ.get('USERPROFILE', ''))
            
            # Typical DCS paths
            possible_paths = [
                user_profile / 'Saved Games' / 'DCS',
                user_profile / 'Saved Games' / 'DCS.openbeta',
                user_profile / 'Saved Games' / 'DCS.release_server',
            ]
            
            for path in possible_paths:
                if path.exists():
                    self.logger.debug(f"Found DCS folder: {path}")
                    return path
            
            # Check if any DCS folder exists
            saved_games = user_profile / 'Saved Games'
            if saved_games.exists():
                for item in saved_games.iterdir():
                    if item.is_dir() and 'DCS' in item.name:
                        self.logger.debug(f"Found potential DCS folder: {item}")
                        return item
            
        except Exception as e:
            self.logger.debug(f"Could not auto-detect DCS folder: {e}")
        
        return None
    
    def _apply_defaults(self):
        """
        Apply default values for any missing configuration keys.
        """
        updated = False
        for key, value in self.DEFAULT_CONFIG.items():
            if key not in self.config:
                self.config[key] = value
                updated = True
                self.logger.debug(f"Applied default for missing key: {key}")
        
        if updated:
            self._save_config()
    
    def _save_config(self):
        """
        Save the current configuration to file.
        """
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2)
            self.logger.debug("Configuration saved successfully")
        except Exception as e:
            self.logger.error(f"Failed to save configuration: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.
        
        Args:
            key: Configuration key
            default: Default value if key not found
            
        Returns:
            Configuration value or default
        """
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any, save: bool = True):
        """
        Set a configuration value.
        
        Args:
            key: Configuration key
            value: Configuration value
            save: Whether to save to file immediately
        """
        self.config[key] = value
        if save:
            self._save_config()
    
    def get_all(self) -> Dict[str, Any]:
        """
        Get all configuration as a dictionary.
        
        Returns:
            Complete configuration dictionary
        """
        return self.config.copy()
    
    def get_dcs_saved_games_folder(self) -> Optional[str]:
        """
        Get the DCS Saved Games folder path.
        
        Returns:
            Path string or None if not configured
        """
        folder = self.config.get('dcs_saved_games_folder', '')
        return folder if folder else None
    
    def get_plugins_directory(self) -> str:
        """
        Get the plugins directory path.
        
        Returns:
            Plugins directory path
        """
        return self.config.get('plugins_directory', 'scripts')
    
    def get_log_level(self) -> str:
        """
        Get the logging level.
        
        Returns:
            Log level string (e.g., 'INFO', 'DEBUG')
        """
        return self.config.get('log_level', 'INFO')
    
    def should_auto_start_plugins(self) -> bool:
        """
        Check if plugins should auto-start.
        
        Returns:
            True if plugins should auto-start
        """
        return self.config.get('auto_start_plugins', True)

    def get_management_server_config(self) -> Dict[str, Any]:
        """
        Get management server configuration.

        Returns:
            Dictionary with server configuration keys:
            - enabled (bool)
            - host (str)
            - port (int)
        """
        default_config = self.DEFAULT_CONFIG.get('management_server', {})
        configured = self.config.get('management_server', {})

        if not isinstance(configured, dict):
            configured = {}

        merged = {
            'enabled': configured.get('enabled', default_config.get('enabled', True)),
            'host': configured.get('host', default_config.get('host', '127.0.0.1')),
            'port': configured.get('port', default_config.get('port', 8765))
        }

        return merged

    def get_watchdog_config(self) -> Dict[str, Any]:
        """
        Get watchdog configuration.

        Returns:
            Dictionary with watchdog configuration keys:
            - enabled (bool)
            - check_interval_seconds (int)
            - timeout_seconds (int)
            - auto_restart (bool)
        """
        default_config = self.DEFAULT_CONFIG.get('watchdog', {})
        configured = self.config.get('watchdog', {})

        if not isinstance(configured, dict):
            configured = {}

        merged = {
            'enabled': configured.get('enabled', default_config.get('enabled', True)),
            'check_interval_seconds': configured.get(
                'check_interval_seconds',
                default_config.get('check_interval_seconds', 5)
            ),
            'timeout_seconds': configured.get(
                'timeout_seconds',
                default_config.get('timeout_seconds', 30)
            ),
            'auto_restart': configured.get('auto_restart', default_config.get('auto_restart', True))
        }

        return merged
    
    def validate(self) -> tuple[bool, list[str]]:
        """
        Validate the configuration.
        
        Returns:
            Tuple of (is_valid, list_of_issues)
        """
        issues = []
        
        # Check DCS folder
        dcs_folder = self.get_dcs_saved_games_folder()
        if not dcs_folder:
            issues.append("DCS Saved Games folder is not configured")
        elif not Path(dcs_folder).exists():
            issues.append(f"DCS Saved Games folder does not exist: {dcs_folder}")
        
        # Check plugins directory
        plugins_dir = self.get_plugins_directory()
        if not plugins_dir:
            issues.append("Plugins directory is not configured")
        
        return (len(issues) == 0, issues)
