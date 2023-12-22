@echo OFF

WHERE /q powershell
if %ERRORLEVEL% NEQ 0  (
	.\scripts\install.bat
) else (
	powershell ".\scripts\install.bat | tee output.log"
)

