REM dll version file must be set before compilation and changes can be committed
call node .\scripts\node\set_version_dll.js

cd backend
msbuild olympus.sln /t:Build /p:Configuration=Release
cd ..

cd client
rmdir /s /q hgt
call npm install
call npm run emit-declarations
call npm run build-release

cd plugins\controltips
call npm install
call npm run build-release
cd ..\..

cd plugins\databasemanager
call npm install
call npm run build-release
cd ..\..

cd ..

cd manager
call npm run build-release
cd ..

REM other version tags are changed after compilation only in the build folder and should not be committed
call node .\scripts\node\set_version_text.js