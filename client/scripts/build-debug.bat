cd scripts
call copy.bat
cd ..
call browserify ./src/index.ts --debug -o ./public/javascripts/bundle.js -t [ babelify --global true --presets [ @babel/preset-env ] --extensions '.js'] -p [ tsify --noImplicitAny ]