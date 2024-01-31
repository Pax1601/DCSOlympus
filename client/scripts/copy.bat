cd ..
echo F|xcopy /Y .\node_modules\leaflet\dist\leaflet.css .\public\stylesheets\leaflet\leaflet.css 
echo F|xcopy /Y .\node_modules\leaflet-gesture-handling\dist\leaflet-gesture-handling.css .\public\stylesheets\leaflet\leaflet-gesture-handling.css
echo F|xcopy /Y .\node_modules\leaflet.nauticscale\dist\leaflet.nauticscale.js .\public\javascripts\leaflet.nauticscale.js
echo F|xcopy /Y .\node_modules\leaflet-path-drag\dist\L.Path.Drag.js .\public\javascripts\L.Path.Drag.js
cd scripts
