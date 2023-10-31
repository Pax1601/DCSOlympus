cd src
msbuild olympus.sln /t:Rebuild /p:Configuration=Release
cd ..
cd client
call npm install
rmdir /s /q "hgt"
call npm run emit-declarations
call npm run build
cd "plugins\controltips"
call npm run build
cd "..\.."
cd "plugins\databasemanager"
call npm run build
cd "..\.."
call npm prune --production
cd ..
call "C:\Program Files (x86)\Inno Setup 6\iscc.exe" "installer\olympus.iss"
