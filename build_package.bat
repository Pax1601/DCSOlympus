call git clean -fx

cd src
msbuild olympus.sln /t:Rebuild /p:Configuration=Release
cd ..

cd scripts/python/configurator
call build_configurator.bat
cd ../../..

cd client
rmdir /s /q "hgt"
call npm install
call npm run emit-declarations
call npm run build-release

cd "plugins\controltips"
call npm install
call npm run build-release
cd "..\.."

cd "plugins\databasemanager"
call npm install
call npm run build-release
cd "..\.."

call npm prune --production
cd ..

call "C:\Program Files (x86)\Inno Setup 6\iscc.exe" "installer\olympus.iss"
