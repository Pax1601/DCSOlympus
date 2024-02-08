
cd frontend

cd website
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

cd server
rmdir /s /q hgt
call npm install
call npm run build-release
cd ..

cd ..