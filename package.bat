rmdir /s /q package

mkdir package

echo F|xcopy /Y .\olympus.json .\package\olympus.json

echo F|xcopy /Y .\scripts\OlympusHook.lua .\package\Scripts\OlympusHook.lua
echo F|xcopy /Y .\scripts\install.bat .\package\Scripts\install.bat
echo F|xcopy /Y .\scripts\OlympusCommand.lua .\package\mod\scripts\OlympusCommand.lua
echo F|xcopy /Y .\scripts\unitPayloads.lua .\package\mod\scripts\unitPayloads.lua
echo F|xcopy /Y .\scripts\templates.lua .\package\mod\scripts\templates.lua
echo F|xcopy /Y .\scripts\mist.lua .\package\mod\scripts\mist.lua
echo F|xcopy /Y .\scripts\mods.lua .\package\mod\scripts\mods.lua

echo D|xcopy /Y /S /E .\mod .\package\mod

echo F|xcopy /Y /I .\bin\*.dll .\package\mod\bin

echo D|xcopy /Y /S /E .\client\public\databases .\package\mod\databases

echo D|xcopy /Y /S /E .\client\bin .\package\client\bin 
echo D|xcopy /Y /S /E .\client\public .\package\client\public 
echo D|xcopy /Y /S /E .\client\routes .\package\client\routes 
echo D|xcopy /Y /S /E .\client\views .\package\client\views 

echo F|xcopy /Y .\client\app.js .\package\client\app.js
echo F|xcopy /Y .\client\client.js .\package\client\client.js 
echo F|xcopy /Y .\client\package.json .\package\client\package.json
echo F|xcopy /Y .\client\configurator.js .\package\client\configurator.js 

echo F|xcopy /Y /I .\client\*.vbs .\package\client 

echo D|xcopy /Y /S /E .\manager\icons .\package\manager\icons
echo D|xcopy /Y /S /E .\manager\ejs .\package\manager\ejs
echo D|xcopy /Y /S /E .\manager\javascripts .\package\manager\javascripts
echo D|xcopy /Y /S /E .\manager\stylesheets .\package\manager\stylesheets

echo F|xcopy /Y /I .\manager\*.* .\package\manager

echo F|xcopy /Y .\img\olympus.ico .\package\img\olympus.ico 
echo F|xcopy /Y .\img\olympus_server.ico .\package\img\olympus_server.ico
echo F|xcopy /Y .\img\olympus_configurator.ico .\package\img\olympus_configurator.ico
echo F|xcopy /Y .\img\configurator_logo.png .\package\img\configurator_logo.png
echo F|xcopy /Y .\img\OlympusLogoFinal_4k.png .\package\img\OlympusLogoFinal_4k.png

echo F|xcopy /Y .\LEGAL.txt .\package\LEGAL.txt  
echo F|xcopy /Y .\INSTRUCTIONS.txt .\package\INSTRUCTIONS.txt 

echo D|xcopy /Y /S /E .\dependencies .\package\dependencies

echo F|xcopy /Y .\install.bat .\package\install.bat 