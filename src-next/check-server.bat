@echo off
echo ========================================
echo   Medical Records - Network Check
echo ========================================
echo.
echo Checking server status...
netstat -an | findstr ":3000"
if %errorlevel% equ 0 (
    echo ✅ Server is RUNNING on port 3000
) else (
    echo ❌ Server is NOT running
    echo Starting server...
    cd /d "C:\Projects\medical-records-center\src-next"
    npm run dev -- --hostname 0.0.0.0
)
echo.
echo Your IP Address:
ipconfig | findstr "IPv4 Address" | findstr "172.19"
echo.
echo Access Links:
echo - Local: http://localhost:3000
echo - Network: http://172.19.32.183:3000
echo.
pause
