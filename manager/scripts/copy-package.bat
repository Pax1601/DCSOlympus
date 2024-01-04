echo D|xcopy /Y /S /E .\icons ..\package\manager\icons
echo D|xcopy /Y /S /E .\ejs ..\package\manager\ejs
echo D|xcopy /Y /S /E .\javascripts ..\package\manager\javascripts
echo D|xcopy /Y /S /E .\stylesheets ..\package\manager\stylesheets

echo F|xcopy /Y /I .\*.* ..\package\manager

cd ..
call node .\scripts\node\set_version_text.js