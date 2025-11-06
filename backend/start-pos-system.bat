@echo off
echo ========================================
echo POS System Startup
echo ========================================
echo.

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is already running
) else (
    echo [ERROR] MongoDB is NOT running!
    echo Please start MongoDB first using start-mongodb.bat
    echo.
    pause
    exit /b 1
)

echo.
echo Starting POS Backend Server...
echo.
start "POS Backend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Backend server starting on http://localhost:5000
echo You can close this window now.
echo.
timeout /t 5

