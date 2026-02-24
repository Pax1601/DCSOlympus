# Configuration Quick Reference

## Files Created
- `config_manager.py` - Configuration management module
- `plugin_manager_config.json` - Auto-created configuration file (default)
- `plugin_manager_config.example.json` - Example configuration
- `CONFIG_README.md` - Full configuration documentation

## Quick Start

### 1. First Run
```bash
python main.py
```
- Auto-creates `plugin_manager_config.json`
- Attempts to detect DCS Saved Games folder
- Loads and starts plugins

### 2. Edit Configuration
Edit `plugin_manager_config.json`:
```json
{
  "dcs_saved_games_folder": "C:\\Users\\YourName\\Saved Games\\DCS.openbeta",
  "plugins_directory": "scripts",
  "log_level": "INFO",
  "auto_start_plugins": true
}
```

### 3. Custom Config Location
```bash
python main.py --config custom_config.json
python main.py -c C:\path\to\config.json
```

## Command Line Arguments

```bash
# Default config in working directory
python main.py

# Custom config location
python main.py --config path/to/config.json
python main.py -c /absolute/path/config.json

# Override log level
python main.py --log-level DEBUG
python main.py --log-level INFO

# Combined
python main.py -c prod.json --log-level WARNING
```

## Configuration Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `version` | string | "1.0" | Config version |
| `dcs_saved_games_folder` | string | "" | Path to DCS Saved Games |
| `plugins_directory` | string | "scripts" | Plugins folder location |
| `log_level` | string | "INFO" | Logging level |
| `auto_start_plugins` | boolean | true | Auto-start plugins on load |
| `plugin_settings` | object | {} | Custom plugin settings |

## Accessing Config in Plugins

```python
class MyPlugin(Plugin):
    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        
        # Access DCS folder
        dcs_folder = self.global_config.get('dcs_saved_games_folder', '')
        self.logger.info(f"DCS folder: {dcs_folder}")
        
        # Access plugin settings
        settings = self.global_config.get('plugin_settings', {})
        
        # Check any config value
        auto_start = self.global_config.get('auto_start_plugins', True)
```

## What Changed

### For Plugin Developers
1. **Plugin `__init__` signature changed**:
   ```python
   # Old
   def __init__(self, plugin_info):
   
   # New
   def __init__(self, plugin_info, global_config=None):
   ```

2. **Access global config**:
   ```python
   super().__init__(plugin_info, global_config)
   # Now you have self.global_config available
   ```

### For Users
1. **Configuration file** created on first run
2. **Command line arguments** to specify config location
3. **DCS folder auto-detection** on Windows
4. **Validation warnings** for misconfiguration

## Files Updated
- `main.py` - Added argparse and ConfigManager
- `plugin_manager.py` - Accepts and passes global_config
- `plugin_base.py` - Plugin constructor accepts global_config
- `scripts/example_plugin/main.py` - Updated signature
- `scripts/advanced_infantry_control/main.py` - Updated signature
- `olympus_plugin_manager.spec` - Added config_manager to build

## See Also
- Full documentation: `CONFIG_README.md`
- Plugin development: `PLUGIN_README.md`
- Build instructions: `BUILD_README.md`
