@echo off
echo ========================================
echo   Medical Records System - Network Access
echo ========================================
echo.
echo Checking your IP addresses...
echo.

ipconfig | findstr "IPv4 Address" | findstr "172.19" > temp_ip.txt
set /p ip=<temp_ip.txt
set ip=%ip:~27%

echo Main Network IP: %ip%
echo.
echo ACCESS LINKS:
echo ========================================
echo Local Access:     http://localhost:3000
echo Network Access:   http://%ip%:3000
echo.
echo Alternative IPs (if main doesn't work):
echo - http://192.168.137.1:3000 (Hotspot)
echo.
echo ========================================
echo Starting server with network access...
echo Press Ctrl+C to stop
echo ========================================
echo.

cd /d "C:\Projects\medical-records-center\src-next"
npm run dev -- --hostname 0.0.0.0

del temp_ip.txt
pause
