call browserify --debug  .\src\index.ts -o ..\server\public\javascripts\bundle.js -t [ babelify --global true --presets [ @babel/preset-env ] --extensions '.js'] -p [ tsify --noImplicitAny ]
