# Building DCS Olympus Plugin Manager to .exe

This guide explains how to compile the DCS Olympus Plugin Manager into a single executable file.

## Prerequisites

- **Python 3.8 or higher** installed and in your system PATH
- **pip** package manager
- **Windows operating system** (for .exe compilation)
- At least **2 GB of free disk space** for build artifacts

## Quick Start

### Option 1: Using PowerShell (Recommended)

```powershell
.\build.ps1
```

### Option 2: Using Batch File

```cmd
build.bat
```

### Option 3: Manual Build

```cmd
pip install -r requirements.txt
pyinstaller --clean olympus_plugin_manager.spec
```

## Build Process

The build script will:

1. **Verify Python and pip installation**
2. **Install/upgrade all dependencies** from `requirements.txt`
3. **Clean previous build artifacts** (build/ and dist/ folders)
4. **Run PyInstaller** to create a single-file executable
5. **Output the final .exe** to the `dist/` folder

## Build Output

After a successful build, you'll find:

- **Executable**: `dist/DCSOlympusPluginManager.exe`
- **Size**: Approximately 100-400 MB (depending on included libraries)

## Required Files for Distribution

The .exe needs these files/folders in the same directory to function:

### Essential Files
- `olympus.json` - Configuration file with API settings
- `scripts/` - Folder containing plugins

### Optional Files (depending on features used)
- `databases/` - JSON databases for units (aircraftdatabase.json, etc.)
- `atc.json` - ATC configuration
- `kokoro-v1.0.int8.onnx` - TTS model file
- `airspaces/` - KML airspace files

## Bundled Components

The executable includes:

### Core System
- Plugin system (plugin_base.py, plugin_manager.py)
- Main entry point (main.py)
- API module (api.py) and all related code

### Modules
- `data/` - Data extractors, types, spawn tables
- `unit/` - Unit management
- `audio/` - Audio processing and recording
- `radio/` - Radio communications
- `utils/` - Utility functions
- `atc/` - Air traffic control modules

### Dependencies
- requests - HTTP client
- numpy - Numerical processing
- scipy - Scientific computing
- soundfile - Audio file handling
- whisper - Speech recognition (optional)
- kokoro - Text-to-speech (optional)

## PyInstaller Configuration

The build is configured through `olympus_plugin_manager.spec`:

### Key Settings
- **Single-file mode**: All dependencies packed into one .exe
- **Console application**: Shows terminal output
- **UPX compression**: Reduces file size
- **Hidden imports**: Explicitly includes all required modules
- **Data files**: Bundles databases and config files

### Excluded Modules
To reduce size, these are excluded:
- matplotlib
- tkinter
- PyQt5/PyQt6
- PySide2/PySide6

## Troubleshooting

### Build Fails - Missing Module

If PyInstaller can't find a module, add it to `hiddenimports` in the spec file:

```python
hiddenimports = [
    'your_missing_module',
    # ... other imports
]
```

### Build Fails - Missing Data File

Add data files to the `datas` list in the spec file:

```python
datas = [
    ('path/to/file', 'destination_folder'),
    # ... other files
]
```

### Executable Crashes on Startup

1. **Check logs**: Run from command line to see error messages
2. **Verify config files**: Ensure olympus.json is present
3. **Check dependencies**: Some libraries may need system DLLs
4. **Disable optional features**: Set `load_whisper=False` and `load_kokoro=False` in API initialization

### Large File Size

The .exe is large due to included libraries. To reduce size:

1. **Remove optional dependencies** from requirements.txt
2. **Exclude unused modules** in the spec file
3. **Use UPX compression** (already enabled)
4. **Consider two-folder distribution** instead of single-file

### Antivirus False Positives

Some antivirus software may flag PyInstaller executables:

1. **Add exception** in your antivirus
2. **Code signing**: Sign the .exe with a certificate
3. **Use VirusTotal** to verify it's a false positive

## Advanced Configuration

### Customizing the Build

Edit `olympus_plugin_manager.spec` to customize:

#### Change Output Name
```python
name='YourCustomName',
```

#### Add Icon
```python
icon='path/to/icon.ico',
```

#### Create Windowed Application (no console)
```python
console=False,
```

#### Debug Mode
```python
debug=True,
```

### Multi-Folder Build

For a smaller startup time but multiple files, change the EXE section:

```python
exe = EXE(
    pyz,
    a.scripts,
    [],  # Don't include binaries/zipfiles/datas here
    exclude_binaries=True,  # Add this
    name='DCSOlympusPluginManager',
    # ... other settings
)

# Add this after EXE
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='DCSOlympusPluginManager'
)
```

## Testing the Executable

After building:

1. **Copy the .exe** to a test folder
2. **Copy required files** (olympus.json, scripts/, databases/)
3. **Run the .exe** from command line
4. **Verify plugins load** and start correctly
5. **Test with actual DCS connection**

## Deployment

To distribute the application:

1. **Create a release folder** with these contents:
   ```
   DCSOlympusPluginManager.exe
   olympus.json
   databases/
   scripts/
   ```

2. **Zip the folder** for easy distribution

3. **Include documentation** on configuration

4. **Provide example plugins** in the scripts folder

## Performance Considerations

- **Startup time**: First run is slower due to unpacking
- **Memory usage**: ~200-500 MB depending on loaded models
- **Plugin loading**: Plugins are loaded dynamically at runtime

## Build Script Options

The build scripts support these environment variables:

- **SKIP_DEPS**: Skip dependency installation (PowerShell only)
  ```powershell
  $env:SKIP_DEPS = "1"
  .\build.ps1
  ```

## Additional Resources

- [PyInstaller Documentation](https://pyinstaller.org/)
- [Python Packaging Guide](https://packaging.python.org/)
- [Plugin Development Guide](PLUGIN_README.md)

## Support

If you encounter issues:

1. Check the build log output
2. Verify all prerequisites are met
3. Try a clean build (delete build/ and dist/ folders)
4. Check for dependency conflicts
5. Test with a minimal plugin setup first
