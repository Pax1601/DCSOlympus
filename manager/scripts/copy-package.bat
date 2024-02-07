xcopy /Y /S /E .\icons ..\package\manager\icons
xcopy /Y /S /E .\ejs ..\package\manager\ejs
xcopy /Y /S /E .\javascripts ..\package\manager\javascripts
xcopy /Y /S /E .\stylesheets ..\package\manager\stylesheets
xcopy /Y /I .\*.* ..\package\manager

cd ..
call node .\scripts\node\set_version_text.js