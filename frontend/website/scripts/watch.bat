cd ..
call .\check_setup.bat 
cd website

watchify .\src\index.ts --debug -o ..\server\public\javascripts\bundle.js -t [ babelify --global true --presets [ @babel/preset-env ] --extensions '.js'] -p [ tsify --noImplicitAny ]