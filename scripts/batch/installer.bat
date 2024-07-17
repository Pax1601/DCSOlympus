@echo OFF

SET PATH=%PATH%;%WINDIR%\System32;%WINDIR%\System32\WindowsPowerShell\v1.0;

WHERE /q powershell
if %ERRORLEVEL% NEQ 0  (
	.\scripts\install.bat
) else (
	powershell ".\scripts\install.bat | tee output.log"
)

