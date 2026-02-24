# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for DCS Olympus Plugin Manager

This builds a single-file executable that includes:
- Plugin system (plugin_base.py, plugin_manager.py, main.py)
- API and all related modules
- All data files (databases, configs, models)
"""

import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Current directory
current_dir = os.path.abspath('.')

# Collect all data files
datas = []

# Add database files
if os.path.exists('databases'):
    datas.append(('databases/*.json', 'databases'))

# Add config files
if os.path.exists('olympus.json'):
    datas.append(('olympus.json', '.'))
    
if os.path.exists('atc.json'):
    datas.append(('atc.json', '.'))

# Add ONNX model files
if os.path.exists('kokoro-v1.0.int8.onnx'):
    datas.append(('kokoro-v1.0.int8.onnx', '.'))

# Add airspaces folder if it exists
if os.path.exists('airspaces'):
    datas.append(('airspaces/*', 'airspaces'))

# Collect hidden imports for all modules
hiddenimports = [
    # Plugin system
    'plugin_base',
    'plugin_manager',
    'config_manager',
    
    # API and core modules
    'api',
    
    # Data modules
    'data.data_extractor',
    'data.data_indexes',
    'data.data_types',
    'data.roes',
    'data.states',
    'data.unit_spawn_table',
    
    # Unit modules
    'unit.unit',
    
    # Audio modules
    'audio.audio_packet',
    'audio.audio_recorder',
    
    # Radio modules
    'radio.radio_listener',
    'radio.radio_transmitter',
    
    # Utils modules
    'utils.utils',
    
    # ATC modules
    'atc',
    'atc.__init__',
    'atc.agency',
    'atc.approach',
    'atc.atis',
    'atc.base',
    'atc.clearance',
    'atc.ground',
    'atc.radar',
    'atc.shared',
    'atc.tower',
    
    # Audio processing libraries
    'soundfile',
    'numpy',
    'scipy',
    'scipy.signal',
    'wave',
    
    # AI/ML libraries (optional but included)
    'whisper',
    'kokoro',
    
    # Standard library modules
    'json',
    'time',
    'requests',
    'base64',
    'signal',
    'logging',
    'os',
    'tempfile',
    'asyncio',
    'threading',
    'pathlib',
    'importlib',
    'importlib.util',
    'sys',
    'enum',
    'abc',
    'typing',
    'argparse',
]

# Try to collect submodules automatically
try:
    hiddenimports.extend(collect_submodules('whisper'))
except:
    pass

try:
    hiddenimports.extend(collect_submodules('kokoro'))
except:
    pass

try:
    hiddenimports.extend(collect_submodules('scipy'))
except:
    pass

a = Analysis(
    ['main.py'],
    pathex=[current_dir],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary modules to reduce size
        'matplotlib',
        'tkinter',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='DCSOlympusPluginManager',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Set to False for GUI application
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon path if you have one: 'icon.ico'
)
