@echo off
REM Build script for DCS Olympus Plugin Manager
REM This script compiles the plugin manager into a single .exe file

echo ========================================
echo DCS Olympus Plugin Manager - Build Script
echo ========================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)
echo Python found.

echo.
echo Installing/upgrading dependencies...
pip install -r requirements.txt --upgrade
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Cleaning previous build artifacts...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"

echo.
echo Building executable with PyInstaller...
echo This may take several minutes...
echo.

pyinstaller --clean olympus_plugin_manager.spec

if errorlevel 1 (
    echo.
    echo ERROR: Build failed
    pause
    exit /b 1
)

REM Give a moment for file system operations to complete
timeout /t 1 /nobreak >nul 2>&1

REM Check if dist folder exists
if not exist "dist" (
    echo.
    echo ERROR: dist folder was not created
    echo PyInstaller may have failed silently
    pause
    exit /b 1
)

REM Check for executable with full path
if exist "%CD%\dist\DCSOlympusPluginManager.exe" (
    echo.
    echo ========================================
    echo Build completed successfully!
    echo ========================================
    echo.
    echo Executable location:
    echo   %CD%\dist\DCSOlympusPluginManager.exe
    echo.
    for %%A in ("%CD%\dist\DCSOlympusPluginManager.exe") do echo File size: %%~zA bytes
    echo.
    echo IMPORTANT: Make sure to include these files/folders with the .exe:
    echo   - olympus.json (configuration file)
    echo   - databases/ folder (if not embedded)
    echo   - scripts/ folder (for plugins)
    echo   - kokoro-v1.0.int8.onnx (if using TTS)
    echo.
) else (
    echo.
    echo ERROR: Executable was not created at expected location
    echo Expected: %CD%\dist\DCSOlympusPluginManager.exe
    echo.
    echo Files in dist folder:
    dir /b "dist" 2>nul
    echo.
    pause
    exit /b 1
)

pause
