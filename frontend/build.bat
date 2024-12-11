cd react
call npm run build-release
cd ..

cd server
robocopy ./databases ./public/databases /E