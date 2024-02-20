rmdir /s /q package
mkdir package

REM copy the main configuration file
echo F|xcopy /Y .\olympus.json .\package\olympus.json

REM copy the installation scripts
echo F|xcopy /Y .\scripts\batch\install.bat .\package\Scripts\install.bat
echo F|xcopy /Y .\scripts\batch\installer.bat .\package\installer.bat 

REM copy the hooks script
echo F|xcopy /Y .\scripts\lua\hooks\OlympusHook.lua .\package\Scripts\OlympusHook.lua

REM copy the lua scripts
echo D|xcopy /Y /S /E .\scripts\lua\backend .\package\mod\scripts

REM copy the mod folder
echo D|xcopy /Y /S /E .\mod .\package\mod

REM copy the databases folder
echo D|xcopy /Y /S /E .\databases .\package\mod\databases

REM copy the backend dll
echo F|xcopy /Y /I .\build\backend\bin\*.dll .\package\mod\bin

REM copy the frontend
echo D|xcopy /Y /S /E .\build\frontend .\package\frontend

REM copy the manager
echo D|xcopy /Y /S /E .\build\manager .\package\manager

REM copy the images folder
echo D|xcopy /Y /S /E .\img\ .\package\img

REM copy the instructions and text files
echo F|xcopy /Y .\LEGAL.txt .\package\LEGAL.txt  
echo F|xcopy /Y .\INSTRUCTIONS.txt .\package\INSTRUCTIONS.txt 
echo F|xcopy /Y .\notes.txt .\package\notes.txt 

REM copy the dependencies
echo D|xcopy /Y /S /E .\dependencies .\package\dependencies

REM other version tags are changed after compilation only in the package folder and should not be committed
call node .\scripts\node\set_version_text.js