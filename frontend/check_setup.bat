@echo off

echo check_setup starting...
if exist "setup" (
    echo setup.bat has already been called, skipping...
) else (
    echo setup.bat has not been called yet, installing!
	call .\setup.bat
)
echo check_setup completed!