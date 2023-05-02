start cmd /k "npm run start"
start cmd /k "watchify .\src\index.ts --debug -o .\public\javascripts\bundle.js -t [ babelify --global true --presets [ @babel/preset-env ] --extensions '.js'] -p [ tsify --noImplicitAny ]
