@echo off
cd /d "C:\Users\josep\the-dude-assistant"

:: Start the Next.js server in a minimized background window
start "The Dude Server" /min cmd /k "npm start"

:: Give the server a few seconds to come up
timeout /t 5 /nobreak >nul

:: Open the browser
start "" "http://127.0.0.1:3000"
