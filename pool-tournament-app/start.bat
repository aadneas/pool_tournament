@echo off
echo Pool Tournament Manager
echo =======================
echo.
echo Checking if Node.js is installed...

REM Try common Node.js installation paths
set "NODE_PATH="
if exist "C:\Program Files\nodejs\node.exe" set "NODE_PATH=C:\Program Files\nodejs\node.exe"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_PATH=C:\Program Files (x86)\nodejs\node.exe"
if exist "%APPDATA%\npm\node.exe" set "NODE_PATH=%APPDATA%\npm\node.exe"

REM Check if node is in PATH
node --version >nul 2>&1
if not errorlevel 1 (
    set "NODE_PATH=node"
    echo Node.js found in PATH!
) else if "%NODE_PATH%"=="" (
    echo ERROR: Node.js is not found!
    echo.
    echo Please ensure Node.js is installed and try one of these:
    echo 1. Restart your computer after installing Node.js
    echo 2. Close and reopen this command prompt
    echo 3. Add Node.js to your PATH environment variable
    echo.
    echo Download Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo Node.js found at: %NODE_PATH%
)
echo.
echo Installing dependencies...
npm install >nul 2>&1 || "%NODE_PATH%" -e "console.log('Using node directly since npm not found')"

echo.
echo Starting Pool Tournament Manager...
echo.
echo The application will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
echo Starting server...
"%NODE_PATH%" server.js