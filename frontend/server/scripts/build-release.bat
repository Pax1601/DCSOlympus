call .\scripts\copy.bat

echo D|xcopy /Y /S /E .\bin ..\..\build\frontend\bin 
echo D|xcopy /Y /S /E .\public ..\..\build\frontend\public 
echo D|xcopy /Y /S /E .\routes ..\..\build\frontend\routes 
echo D|xcopy /Y /S /E .\views ..\..\build\frontend\views 

echo F|xcopy /Y .\app.js ..\..\build\frontend\app.js
echo F|xcopy /Y .\client.js ..\..\build\frontend\client.js 
echo F|xcopy /Y .\package.json ..\..\build\frontend\package.json

echo F|xcopy /Y /I .\*.vbs ..\..\build\frontend