cd scripts
call copy.bat
cd ..
call browserify ./src/index.ts -o ./public/javascripts/bundle.js -t [ babelify --global true --presets [ @babel/preset-env ] --extensions '.js'] -p [ tsify --noImplicitAny ]

echo D|xcopy /Y /S /E .\bin ..\build\client\bin 
echo D|xcopy /Y /S /E .\public ..\build\client\public 
echo D|xcopy /Y /S /E .\routes ..\build\client\routes 
echo D|xcopy /Y /S /E .\views ..\build\client\views 

echo F|xcopy /Y .\app.js ..\build\client\app.js
echo F|xcopy /Y .\client.js ..\build\client\client.js 
echo F|xcopy /Y .\package.json ..\build\client\package.json

echo F|xcopy /Y /I .\*.vbs ..\build\client 