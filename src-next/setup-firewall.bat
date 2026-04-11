@echo off
echo ========================================
echo   Configure Firewall for Port 3000
echo ========================================
echo.
echo This will allow network access to the medical records system
echo.
echo [!] You need to run this as Administrator!
echo.
pause
echo.
echo Adding firewall rule...
netsh advfirewall firewall add rule name="MedicalRecordsDev" dir=in action=allow protocol=TCP localport=3000
echo.
if %errorlevel% equ 0 (
    echo ✅ Firewall rule added successfully
) else (
    echo ❌ Failed to add firewall rule
    echo Please run this script as Administrator
)
echo.
echo Testing firewall...
netsh advfirewall firewall show rule name="MedicalRecordsDev"
echo.
pause
