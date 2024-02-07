echo D|xcopy /Y /S /E .\icons ..\build\manager\icons
echo D|xcopy /Y /S /E .\ejs ..\build\manager\ejs
echo D|xcopy /Y /S /E .\javascripts ..\build\manager\javascripts
echo D|xcopy /Y /S /E .\stylesheets ..\build\manager\stylesheets

echo F|xcopy /Y /I .\*.* ..\build\manager