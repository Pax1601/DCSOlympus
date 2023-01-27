start cmd /k "npm run start"
start cmd /k "watchify .\src\index.ts --debug -p [ tsify --noImplicitAny ] -o .\public\javascripts\bundle.js"
