@echo off
set /p "config=Enter DCS Saved Games folder location: "
concurrently --kill-others "npm run watch" "nodemon --ignore ./public/databases/ ./bin/www -- --config \"%config%\Config\Olympus.json\""