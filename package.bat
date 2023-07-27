cd client
call npm prune --production
cd ..
call "C:\Program Files (x86)\Inno Setup 6\iscc.exe" "installer\olympus.iss"
