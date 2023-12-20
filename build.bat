call node increase_version.js

cd src
msbuild olympus.sln /t:Build /p:Configuration=Release
cd ..

cd client
rmdir /s /q "hgt"
call npm install
call npm run emit-declarations
call npm run copy
call npm run build-release

cd "plugins\controltips"
call npm install
call npm run build-release
cd "..\.."

cd "plugins\databasemanager"
call npm install
call npm run build-release
cd "..\.."

cd..
