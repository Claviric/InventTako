@echo off
set "NODE_HOME=C:\Users\Calvin\.local\nodejs\node-v24.16.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
cd /d "%~dp0backend"
npm install
pause
