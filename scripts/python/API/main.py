"""
DCS Olympus API - Main Entry Point

This script initializes and manages the plugin system for DCS Olympus.
It discovers, loads, and starts all plugins located in the 'scripts' folder.
"""

import asyncio
import sys
import os
import logging
import signal
import argparse
from pathlib import Path

from plugin_manager import PluginManager
from config_manager import ConfigManager


def get_base_path():
    """
    Get the base path for the application.
    
    When running as a PyInstaller executable, this returns the directory
    containing the .exe file. When running as a script, returns the script directory.
    
    Returns:
        Path: Base directory path
    """
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        return Path(sys.executable).parent
    else:
        # Running as script
        return Path(__file__).parent


def setup_logging(log_level=logging.INFO, base_path=None):
    """
    Configure logging for the application.
    
    Args:
        log_level: Logging level (default: INFO)
        base_path: Base directory path for log file
    """
    if base_path is None:
        base_path = get_base_path()
    
    log_file = base_path / 'olympus_plugins.log'
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(str(log_file), encoding='utf-8')
        ]
    )


def signal_handler(signum, frame):
    """
    Handle shutdown signals gracefully.
    
    Args:
        signum: Signal number
        frame: Current stack frame
    """
    logger = logging.getLogger("Main")
    logger.info(f"Received signal {signum}, shutting down...")
    
    # Stop all plugins
    if 'plugin_manager' in globals():
        logger.info("Stopping watchdog...")
        plugin_manager.stop_watchdog()
        logger.info("Stopping all plugins...")
        plugin_manager.stop_all_plugins()
        logger.info("Stopping management server...")
        plugin_manager.stop_management_server()
    
    sys.exit(0)


def parse_arguments():
    """
    Parse command line arguments.
    
    Returns:
        Parsed arguments namespace
    """
    parser = argparse.ArgumentParser(
        description='DCS Olympus Plugin Manager',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py
  python main.py --config custom_config.json
  python main.py -c C:\\path\\to\\config.json
        """
    )
    
    parser.add_argument(
        '-c', '--config',
        type=str,
        default=None,
        help='Path to configuration file (default: plugin_manager_config.json in working directory)'
    )
    
    parser.add_argument(
        '--log-level',
        type=str,
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default=None,
        help='Override log level from config file'
    )
    
    return parser.parse_args()


def main():
    """
    Main entry point for DCS Olympus API.
    """
    # Parse command line arguments
    args = parse_arguments()
    
    # Get base path (handles both script and .exe execution)
    base_path = get_base_path()
    
    # Change to base directory to ensure relative paths work
    os.chdir(base_path)
    
    # Load configuration
    config_path = None
    if args.config:
        config_path = Path(args.config)
        if not config_path.is_absolute():
            config_path = base_path / config_path
    
    config_manager = ConfigManager(config_path)
    global_config = config_manager.get_all()
    
    # Determine log level (command line overrides config)
    log_level_str = args.log_level or config_manager.get_log_level()
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)
    
    # Setup logging
    setup_logging(log_level, base_path)
    logger = logging.getLogger("Main")
    
    # Log execution mode
    if getattr(sys, 'frozen', False):
        logger.info("Running as compiled executable")
    else:
        logger.info("Running as Python script")
    
    logger.info(f"Base path: {base_path}")
    logger.info(f"Configuration file: {config_manager.config_path}")
    logger.info("=" * 60)
    logger.info("DCS Olympus API - Plugin System")
    logger.info("=" * 60)
    
    # Validate configuration
    is_valid, issues = config_manager.validate()
    if not is_valid:
        logger.warning("Configuration validation warnings:")
        for issue in issues:
            logger.warning(f"  - {issue}")
        logger.warning("Some features may not work correctly")
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Generate the asyncio event loop in the main thread to be used by plugins
    loop = asyncio.get_event_loop()
    
    # Initialize the plugin manager with configuration
    logger.info("Initializing Plugin Manager...")
    global plugin_manager
    plugins_dir = base_path / config_manager.get_plugins_directory()
    plugin_manager = PluginManager(
        plugins_directory=str(plugins_dir),
        global_config=global_config
    )
    plugin_manager.set_event_loop(loop)

    # Configure and start watchdog
    watchdog_config = config_manager.get_watchdog_config()
    plugin_manager.configure_watchdog(
        enabled=watchdog_config.get('enabled', True),
        check_interval_seconds=watchdog_config.get('check_interval_seconds', 5),
        timeout_seconds=watchdog_config.get('timeout_seconds', 30),
        auto_restart=watchdog_config.get('auto_restart', True)
    )
    plugin_manager.start_watchdog()

    # Start management server
    management_server = config_manager.get_management_server_config()
    if management_server.get('enabled', True):
        host = str(management_server.get('host', '127.0.0.1'))
        port = int(management_server.get('port', 8765))
        started = plugin_manager.start_management_server(host=host, port=port)
        if started:
            logger.info(f"Plugin management UI/API available at http://{host}:{port}")
        else:
            logger.warning("Plugin management server failed to start")
    else:
        logger.info("Management server is disabled in configuration")
    
    # Load all plugins
    logger.info("Loading plugins...")
    loaded_count = plugin_manager.load_all_plugins()
    
    if loaded_count == 0:
        logger.warning("No plugins loaded. Ensure plugins are in the 'scripts' folder.")
        logger.info("Each plugin should have:")
        logger.info("  - A folder in the 'scripts' directory")
        logger.info("  - A .json descriptor file")
        logger.info("  - A main.py file (or file specified in descriptor)")
        logger.info("  - A class that inherits from Plugin")
    else:
        logger.info(f"Successfully loaded {loaded_count} plugin(s)")
        
        # List all loaded plugins
        plugins = plugin_manager.list_plugins()
        logger.info("Loaded plugins:")
        for plugin_name in plugins:
            plugin_info = plugin_manager.get_plugin(plugin_name).get_info()
            logger.info(f"  - {plugin_info['name']} v{plugin_info['version']} by {plugin_info['author']}")
            logger.info(f"    {plugin_info['description']}")
        
        # Start plugins if configured to auto-start
        if config_manager.should_auto_start_plugins():
            logger.info("=" * 60)
            logger.info("Starting all plugins...")
            start_results = plugin_manager.start_all_plugins(loop)
            
            success_count = sum(1 for success in start_results.values() if success)
            logger.info(f"Started {success_count}/{len(start_results)} plugin(s) successfully")
        else:
            logger.info("Auto-start disabled. Plugins loaded but not started.")
        
        # Display status
        logger.info("=" * 60)
        logger.info("Plugin Status:")
        status_dict = plugin_manager.get_all_plugin_status()
        for name, info in status_dict.items():
            logger.info(f"  {name}: {info['status']}")
        
        logger.info("=" * 60)
        logger.info("DCS Olympus API is running. Press Ctrl+C to stop.")
        
        # Start the asyncio event loop to keep the main thread alive
        try:
            asyncio.get_event_loop().run_forever()
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received, shutting down...")
            signal_handler(signal.SIGINT, None)
            
if __name__ == "__main__":
    main()
