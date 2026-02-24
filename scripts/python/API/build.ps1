# Build script for DCS Olympus Plugin Manager
# This script compiles the plugin manager into a single .exe file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DCS Olympus Plugin Manager - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if pip is installed
Write-Host "Checking pip installation..." -ForegroundColor Yellow
try {
    $pipVersion = pip --version 2>&1
    Write-Host "Found: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: pip is not installed" -ForegroundColor Red
    exit 1
}

# Install/upgrade dependencies
Write-Host ""
Write-Host "Installing/upgrading dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --upgrade

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Clean previous build artifacts
Write-Host ""
Write-Host "Cleaning previous build artifacts..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
    Write-Host "Removed build/ directory" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "Removed dist/ directory" -ForegroundColor Green
}

# Build the executable using PyInstaller
Write-Host ""
Write-Host "Building executable with PyInstaller..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Write-Host ""

pyinstaller --clean olympus_plugin_manager.spec

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

# Give a moment for file system operations to complete
Start-Sleep -Milliseconds 500

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host ""
    Write-Host "ERROR: dist folder was not created" -ForegroundColor Red
    Write-Host "PyInstaller may have failed silently" -ForegroundColor Red
    exit 1
}

# Check if the executable was created
$exePath = Join-Path $PWD "dist\DCSOlympusPluginManager.exe"
if (Test-Path $exePath) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Executable location:" -ForegroundColor Cyan
    Write-Host "  $exePath" -ForegroundColor White
    Write-Host ""
    
    # Get file size
    $fileSize = (Get-Item $exePath).Length / 1MB
    Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Make sure to include these files/folders with the .exe:" -ForegroundColor Yellow
    Write-Host "  - olympus.json (configuration file)" -ForegroundColor White
    Write-Host "  - databases/ folder (if not embedded)" -ForegroundColor White
    Write-Host "  - scripts/ folder (for plugins)" -ForegroundColor White
    Write-Host "  - kokoro-v1.0.int8.onnx (if using TTS)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Executable was not created at expected location" -ForegroundColor Red
    Write-Host "Expected: $exePath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Files in dist folder:" -ForegroundColor Yellow
    if (Test-Path "dist") {
        Get-ChildItem "dist" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
    }
    Write-Host ""
    exit 1
}
