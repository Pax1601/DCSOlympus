# DCS Olympus API - Plugin System

This plugin system allows you to extend the DCS Olympus API with modular, self-contained plugins.

## Architecture

The plugin system consists of three main components:

1. **plugin_base.py** - Base `Plugin` class that all plugins must inherit from
2. **plugin_manager.py** - `PluginManager` class that handles discovery, loading, and lifecycle management
3. **main.py** - Entry point that initializes the system and starts all plugins

## Creating a Plugin

### Plugin Structure

Each plugin must be in its own folder within the `scripts` directory:

```
scripts/
└── your_plugin/
    ├── plugin.json       # Plugin descriptor
    └── main.py           # Main plugin code
```

### Plugin Descriptor (plugin.json)

The descriptor file must be a valid JSON file containing at least the following fields:

```json
{
  "name": "YourPlugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A brief description of your plugin",
  "main": "main.py",
  "enabled": true,
  "config": {
    "custom_setting": "value"
  }
}
```

**Required fields:**
- `name` - Plugin name (if omitted, folder name is used)

**Optional fields:**
- `version` - Plugin version (default: "0.0.0")
- `author` - Plugin author (default: "Unknown")
- `description` - Plugin description
- `main` - Main Python file (default: "main.py")
- `enabled` - Whether plugin should be loaded (not currently enforced)
- `config` - Custom configuration dictionary accessible to your plugin

### Plugin Implementation (main.py)

Your plugin's main.py must contain a class that inherits from `Plugin` and implements the required methods:

```python
import sys
from pathlib import Path

# Add API directory to path
api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from plugin_base import Plugin


class YourPlugin(Plugin):
    """Your plugin implementation."""
    
    def __init__(self, plugin_info):
        """Initialize your plugin."""
        super().__init__(plugin_info)
        # Your initialization code here
    
    def on_start(self) -> bool:
        """
        Called when the plugin should start.
        
        Returns:
            bool: True if started successfully, False otherwise
        """
        # Your start logic here
        return True
    
    def on_stop(self) -> bool:
        """
        Called when the plugin should stop.
        
        Returns:
            bool: True if stopped successfully, False otherwise
        """
        # Your stop logic here
        return True
    
    def on_pause(self) -> bool:
        """
        Called when the plugin should pause.
        
        Returns:
            bool: True if paused successfully, False otherwise
        """
        # Your pause logic here
        return True
    
    def on_resume(self) -> bool:
        """
        Called when the plugin should resume from pause.
        
        Returns:
            bool: True if resumed successfully, False otherwise
        """
        # Your resume logic here
        return True
```

## Plugin Lifecycle

Plugins have the following states (defined in `PluginStatus` enum):

- **INITIALIZED** - Plugin has been loaded but not started
- **RUNNING** - Plugin is actively running
- **PAUSED** - Plugin is paused (still loaded but operations suspended)
- **STOPPED** - Plugin has been stopped
- **ERROR** - Plugin encountered an error

### Lifecycle Methods

The `Plugin` base class provides these public methods:

- `start()` - Start the plugin (calls `on_start()`)
- `stop()` - Stop the plugin (calls `on_stop()`)
- `pause()` - Pause the plugin (calls `on_pause()`)
- `resume()` - Resume the plugin (calls `on_resume()`)
- `get_status()` - Get current plugin status
- `get_info()` - Get plugin information (name, version, status, etc.)

## Running the Plugin System

To start the DCS Olympus API with all plugins:

```bash
python main.py
```

The system will:
1. Discover all plugins in the `scripts` folder
2. Load each plugin that has a valid descriptor and main script
3. Automatically start all loaded plugins
4. Keep running until interrupted (Ctrl+C)
5. Gracefully stop all plugins on shutdown

## Plugin Manager API

The `PluginManager` class provides methods for controlling plugins:

```python
# Start specific plugin
plugin_manager.start_plugin("PluginName")

# Stop specific plugin
plugin_manager.stop_plugin("PluginName")

# Pause specific plugin
plugin_manager.pause_plugin("PluginName")

# Resume specific plugin
plugin_manager.resume_plugin("PluginName")

# Reload specific plugin (plugin must already be stopped)
plugin_manager.reload_plugin("PluginName")

# Start all plugins
plugin_manager.start_all_plugins()

# Stop all plugins
plugin_manager.stop_all_plugins()

# Get plugin status
status = plugin_manager.get_plugin_status("PluginName")

# Get all plugin statuses
all_status = plugin_manager.get_all_plugin_status()

# List all loaded plugins
plugin_names = plugin_manager.list_plugins()

# Get plugin instance
plugin = plugin_manager.get_plugin("PluginName")
```

### Reload Behavior

- Reload is only allowed when a plugin is in the **STOPPED** state.
- Running or paused plugins must be stopped by the user before reload.
- The management web UI disables the **Reload** action until the plugin is stopped.

## Logging

Each plugin has access to a logger via `self.logger`:

```python
self.logger.info("Information message")
self.logger.warning("Warning message")
self.logger.error("Error message")
self.logger.debug("Debug message")
```

Logs are written to both the console and `olympus_plugins.log` file.

## Example Plugin

See the `scripts/example_plugin` folder for a complete working example that demonstrates:
- Plugin structure and descriptor
- Lifecycle implementation
- Background thread management
- Pause/resume functionality
- Logging

## Best Practices

1. **Always call `super().__init__(plugin_info)` in your `__init__` method**
2. **Handle exceptions in lifecycle methods and return False on failure**
3. **Use `self.logger` for all logging instead of print statements**
4. **Clean up resources (threads, connections, files) in `on_stop()`**
5. **Make pause/resume meaningful - don't just stop/start**
6. **Use daemon threads for background tasks so they don't block shutdown**
7. **Access plugin info via `self.plugin_info` dictionary**
8. **Store custom config in the descriptor's "config" field**

## Troubleshooting

**Plugin not discovered:**
- Ensure plugin folder is in the `scripts` directory
- Check that a `.json` descriptor file exists
- Verify the main script file exists (default: `main.py`)

**Plugin not loading:**
- Check that your class inherits from `Plugin`
- Ensure the class is not named exactly `Plugin` (must be a subclass)
- Review logs for import errors or exceptions

**Plugin fails to start:**
- Check the logs for error messages
- Ensure `on_start()` returns `True`
- Verify all dependencies are installed and importable
