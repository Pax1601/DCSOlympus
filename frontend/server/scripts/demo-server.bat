cd ..
call .\check_setup.bat 
cd server

call .\scripts\copy.bat
call .\scripts\create-mock-dcs.bat
node .\bin\demo --config %1