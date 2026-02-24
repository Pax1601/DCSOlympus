# Plugin Manager Configuration Guide

## Configuration File

The plugin manager uses a JSON configuration file (`plugin_manager_config.json`) to store settings.

### Location

By default, the configuration file is looked for in the working directory:
```
plugin_manager_config.json
```

You can specify a custom location using the `--config` or `-c` command line argument:
```bash
python main.py --config path/to/config.json
DCSOlympusPluginManager.exe -c C:\custom\config.json
```

### Auto-Creation

If the configuration file doesn't exist, it will be automatically created with default values. The system will attempt to auto-detect your DCS Saved Games folder.

## Configuration Options

### Example Configuration

```json
{
  "version": "1.0",
  "dcs_saved_games_folder": "C:\\Users\\YourUsername\\Saved Games\\DCS.openbeta",
  "plugins_directory": "scripts",
  "log_level": "INFO",
  "auto_start_plugins": true,
  "plugin_settings": {
    "example": "Configuration for specific plugins can go here"
  }
}
```

### Configuration Fields

#### `version` (string)
Configuration file version for compatibility tracking.
- Default: `"1.0"`

#### `dcs_saved_games_folder` (string)
Path to your DCS Saved Games folder. This is where DCS stores missions, tracks, and configuration.

Common locations:
- `C:\Users\YourUsername\Saved Games\DCS` (Stable)
- `C:\Users\YourUsername\Saved Games\DCS.openbeta` (Open Beta)
- `C:\Users\YourUsername\Saved Games\DCS.release_server` (Dedicated Server)

**Important**: Use double backslashes (`\\`) in JSON on Windows, or forward slashes (`/`).

#### `plugins_directory` (string)
Relative path to the folder containing plugins.
- Default: `"scripts"`
- Plugins will be discovered in subdirectories of this folder

#### `log_level` (string)
Logging verbosity level.
- Options: `"DEBUG"`, `"INFO"`, `"WARNING"`, `"ERROR"`, `"CRITICAL"`
- Default: `"INFO"`
- Can be overridden with `--log-level` command line argument

#### `auto_start_plugins` (boolean)
Whether to automatically start plugins after loading them.
- Default: `true`
- If `false`, plugins are loaded but not started

#### `plugin_settings` (object)
Optional settings that can be accessed by plugins through `self.global_config`.
- Plugins access this via `self.global_config['plugin_settings']`
- Use for shared configuration across multiple plugins

## Command Line Arguments

### `--config` or `-c`
Specify configuration file location.

```bash
# Using default config
python main.py

# Using custom config
python main.py --config my_config.json
python main.py -c C:\configs\olympus.json
```

### `--log-level`
Override the log level from the config file.

```bash
python main.py --log-level DEBUG
python main.py --log-level ERROR
```

## Accessing Configuration in Plugins

Plugins receive the global configuration through `self.global_config`:

```python
class MyPlugin(Plugin):
    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        
        # Access DCS folder
        dcs_folder = self.global_config.get('dcs_saved_games_folder', '')
        
        # Access plugin settings
        plugin_settings = self.global_config.get('plugin_settings', {})
        
        # Access any configuration key
        plugins_dir = self.global_config.get('plugins_directory', 'scripts')
```

## Configuration Validation

The system validates configuration on startup and warns about issues:

- **DCS folder not set**: Warning that DCS folder is not configured
- **DCS folder doesn't exist**: Warning that the specified path doesn't exist
- **Plugins directory not set**: Warning about missing plugins directory

Validation warnings don't prevent startup but indicate potential issues.

## Auto-Detection

On first run, the system attempts to auto-detect:

1. **DCS Saved Games folder** - Searches common Windows locations:
   - `%USERPROFILE%\Saved Games\DCS`
   - `%USERPROFILE%\Saved Games\DCS.openbeta`
   - `%USERPROFILE%\Saved Games\DCS.release_server`
   - Any folder containing "DCS" in the Saved Games directory

2. If detected, the path is automatically set in the default configuration.

## Example Usage

### Basic Setup

1. Run the plugin manager for the first time:
   ```bash
   python main.py
   ```

2. Edit the auto-created `plugin_manager_config.json` file:
   ```json
   {
     "dcs_saved_games_folder": "C:\\Users\\YourName\\Saved Games\\DCS.openbeta"
   }
   ```

3. Run again - configuration is now loaded

### Custom Configuration Location

```bash
# Development config
python main.py -c dev_config.json

# Production config
python main.py -c C:\production\olympus_config.json

# Testing with debug logging
python main.py -c test_config.json --log-level DEBUG
```

### Multiple Environments

Create separate configuration files:

**dev_config.json** - Development settings
```json
{
  "dcs_saved_games_folder": "C:\\Dev\\DCS_Test",
  "log_level": "DEBUG",
  "auto_start_plugins": false
}
```

**prod_config.json** - Production settings
```json
{
  "dcs_saved_games_folder": "C:\\Users\\User\\Saved Games\\DCS.openbeta",
  "log_level": "INFO",
  "auto_start_plugins": true
}
```

## Troubleshooting

### Configuration File Not Found
If you see warnings about configuration file not found:
- Check the working directory
- Use absolute paths with `--config`
- Verify file name is correct: `plugin_manager_config.json`

### Invalid JSON
If configuration fails to parse:
- Validate JSON syntax (use a JSON validator)
- Check for missing commas or quotes
- Ensure backslashes are escaped: `\\` not `\`

### DCS Folder Not Found
If DCS folder warnings appear:
- Verify the path exists
- Use the correct DCS installation (stable/beta/server)
- Check for typos in the path
- Use raw string format with double backslashes

### Plugins Not Loading
If plugins aren't discovered:
- Check `plugins_directory` setting
- Verify plugins are in correct location
- Check plugin folder structure (must have .json and main.py)

## Security Considerations

- **File Permissions**: Ensure the config file is readable
- **Path Traversal**: Use absolute paths or verify relative paths
- **Sensitive Data**: Don't store passwords in the config file
- **Config Location**: Keep config files in secure directories
