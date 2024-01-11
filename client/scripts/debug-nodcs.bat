cd scripts
call ./copy.bat
cd ..

REM create a "fake" dcs Saved Games folder
mkdir "%temp%\DCS Olympus\dcs"
echo F|xcopy /Y "..\olympus.json" "%temp%\DCS Olympus\dcs\Config\olympus.json"
echo D|xcopy /Y /S /E "..\databases" "%temp%\DCS Olympus\dcs\Mods\Services\Olympus\databases"

concurrently --kill-others "node ./bin/demo --config \"%temp%\DCS Olympus\dcs\Config\olympus.json\"" "npm run watch" "nodemon --ignore ./public/databases/ ./bin/www -- --config \"%temp%\DCS Olympus\dcs\Config\olympus.json\""    