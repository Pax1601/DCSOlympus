REM dll version file must be set before compilation and changes can be committed
call node .\scripts\node\set_version_dll.js

cd backend
msbuild olympus.sln /t:Build /p:Configuration=Release
cd ..

cd frontend

cd react
call npm install
call npm build-release
cd ..

cd server
rmdir /s /q hgt
call npm install
call npm run build-release
cd ..

cd ..

cd manager
call npm run build-release
cd ..
