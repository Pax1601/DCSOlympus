call browserify .\src\index.ts -o ..\..\build\frontend\public\javascripts\bundle.js -t [ babelify --global true --presets [ @babel/preset-env ] --extensions '.js'] -p [ tsify --noImplicitAny ]
