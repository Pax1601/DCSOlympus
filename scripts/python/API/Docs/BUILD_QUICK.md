# Quick Build Guide

## To Build the .exe:

**Option 1: PowerShell**
```powershell
.\build.ps1
```

**Option 2: Batch File**
```cmd
build.bat
```

**Option 3: Manual**
```cmd
pip install -r requirements.txt
pyinstaller --clean olympus_plugin_manager.spec
```

## Output Location:
```
dist/DCSOlympusPluginManager.exe
```

## To Create Deployment Package:
```powershell
.\package.ps1
```

This creates `DCSOlympusPluginManager_Package.zip` with everything needed.

## What Gets Bundled:
- Plugin system (plugin_base.py, plugin_manager.py)
- API and all modules (api.py, data/, unit/, audio/, radio/, utils/, atc/)
- Database files (databases/*.json)
- Config files (olympus.json, atc.json)
- Model files (*.onnx)

## Required Files to Distribute:
- DCSOlympusPluginManager.exe
- olympus.json (configuration)
- scripts/ folder (for plugins)
- databases/ folder (optional, can be embedded)

## First Time Setup:
1. Install Python 3.8+
2. Run: `pip install -r requirements.txt`
3. Run: `.\build.ps1`
4. Run: `.\package.ps1`

## Troubleshooting:
- **Build fails**: Check Python and pip are installed
- **Import errors**: Run `pip install -r requirements.txt --upgrade`
- **Missing files**: Check olympus.json exists
- **.exe crashes**: Run from command line to see errors

## Documentation:
- Full build guide: `BUILD_README.md`
- Plugin development: `PLUGIN_README.md`
