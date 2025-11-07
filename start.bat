@echo off
echo Pool Tournament Manager (Firebase Version)
echo =========================================
echo.
echo Checking if Python is installed for local testing...

REM Check if python is in PATH
python --version >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_PATH=python"
    echo Python found in PATH!
    goto :start_server
)

REM Try py command (Python Launcher)
py --version >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_PATH=py"
    echo Python found using py launcher!
    goto :start_server
)

echo ERROR: Python is not found!
echo.
echo For local testing, you need Python installed.
echo Download Python from: https://www.python.org/
echo.
echo Alternative: Use 'npx http-server' if you have Node.js installed
echo.
pause
exit /b 1

:start_server
echo.
echo Starting local development server...
echo.
echo The application will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
echo Starting Python HTTP server...
echo Note: This serves static files only. Firebase will handle data storage.
echo.
"%PYTHON_PATH%" -m http.server 8000