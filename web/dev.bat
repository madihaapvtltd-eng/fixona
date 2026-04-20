@echo off
echo Starting Fixora dev server on port 5175...
cd /d "%~dp0"
npm run dev -- --port 5175
pause
