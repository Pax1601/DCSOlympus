cd client
cd "plugins\controltips"
call npm run build
cd "..\.."
cd "plugins\databasemanager"
call npm run build
cd "..\.."
call npm prune --production
cd ..
call "C:\Program Files (x86)\Inno Setup 6\iscc.exe" "installer\olympus.iss"
