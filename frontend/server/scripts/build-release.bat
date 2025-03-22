call npm run tsc

echo D|xcopy /Y /S /E .\public ..\..\build\frontend\public 
echo D|xcopy /Y /S /E .\databases ..\..\build\frontend\public\databases 
echo D|xcopy /Y /S /E .\views ..\..\build\frontend\cert 
echo D|xcopy /Y /S /E .\build ..\..\build\frontend\build 

echo F|xcopy /Y .\app.js ..\..\build\frontend\app.js
echo F|xcopy /Y .\client.js ..\..\build\frontend\client.js 
echo F|xcopy /Y .\package.json ..\..\build\frontend\package.json

echo F|xcopy /Y /I .\*.vbs ..\..\build\frontend