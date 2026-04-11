@echo off
echo Starting Medical Records System for Network Access...
echo.
echo ========================================
echo Local Access: http://localhost:3000
echo Network Access: http://172.19.32.192:3000
echo.
echo Server will be accessible from any device on the same network
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "C:\Projects\medical-records-center\src-next"
npm run dev -- --hostname 0.0.0.0

pause
