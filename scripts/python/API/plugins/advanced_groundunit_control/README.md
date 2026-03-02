# Advanced Infantry Control Plugin

## Overview

This plugin provides advanced control and management capabilities for infantry units in DCS Olympus.

## Structure

```
advanced_infantry_control/
├── plugin.json          # Plugin descriptor and configuration
├── main.py             # Main plugin implementation
└── README.md           # This file
```

## Configuration (plugin.json)

- **update_interval**: Update frequency in seconds (default: 1.0)
- **max_units**: Maximum number of infantry units to manage (default: 100)
- **debug_mode**: Enable verbose debug logging (default: false)

## Implementation Status

### ✅ Completed
- Plugin skeleton and structure
- Configuration loading
- Lifecycle methods (start, stop, pause, resume)
- Method stubs for infantry operations

### 🔨 TODO - Add Your Implementation
The following methods have placeholders ready for your code:

#### Core Operations
- `spawn_infantry_unit()` - Spawn infantry at a position
- `move_unit()` - Command unit movement
- `get_unit_status()` - Retrieve unit state information

#### Formation Management
- `set_formation()` - Arrange units in tactical formations (line, column, wedge, etc.)

#### Vehicle Interaction
- `disembark_from_vehicle()` - Exit vehicles
- `embark_to_vehicle()` - Board vehicles

#### Combat Control
- `set_combat_behavior()` - Control engagement rules (defensive, aggressive, hold fire, etc.)

## Usage Example

```python
# The plugin is automatically loaded by the plugin manager
# Access it through the plugin manager:

plugin = plugin_manager.get_plugin("AdvancedInfantryControl")

# Your code can then call the plugin methods:
# plugin.spawn_infantry_unit(position, "infantry_rifleman", count=8)
# plugin.move_unit(unit_id, destination)
# plugin.set_formation([unit1, unit2, unit3], "wedge")
```

## Adding Your Code

1. **Initialize API Connection** in `on_start()`:
   ```python
   from api import API
   self.api = API(username="InfantryControl")
   ```

2. **Implement Data Structures**:
   - `self.infantry_units` - Track managed units
   - `self.formations` - Store formation data
   - `self.waypoints` - Manage movement queues

3. **Add Update Loop** (if needed):
   ```python
   import threading
   
   def _update_loop(self):
       while self.running:
           if not self.paused:
               # Update unit positions, status, etc.
               pass
           time.sleep(self.update_interval)
   
   # Start in on_start():
   self.update_thread = threading.Thread(target=self._update_loop, daemon=True)
   self.update_thread.start()
   ```

4. **Implement Each Method**:
   - Use `self.api` to communicate with DCS
   - Update `self.infantry_units` to track state
   - Use `self.logger` for all output
   - Handle errors gracefully

## Data Structure Suggestions

```python
# Example infantry unit structure
self.infantry_units[unit_id] = {
    "id": unit_id,
    "type": "infantry_rifleman",
    "count": 8,
    "position": {"lat": 0, "lng": 0},
    "status": "moving",  # idle, moving, in_combat, embarked
    "vehicle_id": None,
    "formation": "wedge",
    "behavior": "defensive",
    "waypoints": [],
    "health": 100
}
```

## Integration with API

Use the existing `api.py` module for DCS communication:

```python
# Get units from DCS
self.api.update_units()
units = self.api.units

# Send commands
self.api.spawn_unit(...)
self.api.set_unit_position(...)
```

## Testing

Run the main plugin manager to test:
```bash
python main.py
```

The plugin will be automatically discovered, loaded, and started.

## Logging

All log messages go to:
- Console output
- `olympus_plugins.log` file

Use the logger levels appropriately:
```python
self.logger.debug("Detailed info")    # Debug details
self.logger.info("Normal operation")  # Standard messages
self.logger.warning("Unusual state")  # Warnings
self.logger.error("Failed operation") # Errors
```
