call .\scripts\create-mock-dcs.bat
nodemon --watch src\demo\**\*.ts --exec node --inspect -r ts-node\register .\src\demo\www.ts -c %1