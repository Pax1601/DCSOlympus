@echo OFF
echo [36m"*********************************************************************"[0m
echo [36m"*  _____   _____  _____    ____  _                                  *"[0m
echo [36m"* |  __ \ / ____|/ ____|  / __ \| |                                 *"[0m
echo [36m"* | |  | | |    | (___   | |  | | |_   _ _ __ ___  _ __  _   _ ___  *"[0m
echo [36m"* | |  | | |     \___ \  | |  | | | | | | '_ ` _ \| '_ \| | | / __| *"[0m
echo [36m"* | |__| | |____ ____) | | |__| | | |_| | | | | | | |_) | |_| \__ \ *"[0m
echo [36m"* |_____/ \_____|_____/   \____/|_|\__, |_| |_| |_| .__/ \__,_|___/ *"[0m
echo [36m"*                                   __/ |         | |               *"[0m
echo [36m"*                                  |___/          |_|               *"[0m
echo [36m"*********************************************************************"[0m
echo [36mWelcome to the DCS Olympus v{{OLYMPUS_VERSION_NUMBER}} installation script. Please wait while the necessary dependencies are installed![0m
echo:


WHERE /q powershell
if %ERRORLEVEL% NEQ 0  (
	echo [30m[106mPowershell not installed in the system, no output log available.[0m
) else (
	echo [30m[106mThe output of this script is also available in the file %CD%\output.log. If you encounter any error, make sure to attach that file to your help request![0m
)

timeout /t 5

echo Checking if node.js framework is installed...

REM Check if node is installed
node -v 2> Nul
if "%errorlevel%" == "9009" (
    echo node.js could not be found, installing it...
	msiexec /i "%CD%\dependencies\node-v20.10.0-x64.msi" /passive
	set "PATH=%PATH%;%programfiles%\nodejs"
) else (
	echo node.js is already installed, continuing installation!
)

echo Installing node modules for client application...
cd .\client
call npm install --omit=dev --silent
cd..

echo Installing node modules for manager application...
cd .\manager
call npm install --omit=dev --silent
cd..

echo Generating shortcuts...
set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%USERPROFILE%\Desktop\DCS Olympus Manager.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%CD%\manager\manager.vbs" >> %SCRIPT%
echo oLink.WorkingDirectory = "%CD%\manager" >> %SCRIPT%
echo oLink.IconLocation = "%CD%\img\olympus_configurator.ico" >> %SCRIPT%

echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%CD%\DCS Olympus Manager.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%CD%\manager\manager.vbs" >> %SCRIPT%
echo oLink.WorkingDirectory = "%CD%\manager" >> %SCRIPT%
echo oLink.IconLocation = "%CD%\img\olympus_configurator.ico" >> %SCRIPT%

echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo [32mAll done! This window will close in 5 seconds. It may take a couple of seconds for the Olympus Manager to start, please wait... [0m

timeout /t 5

cd manager
start cscript manager.vbs