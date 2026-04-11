@echo off
echo ========================================
echo   Testing Appointment Doctor Dropdown
echo ========================================
echo.
echo Testing API endpoints...
echo.

echo 1. Testing Doctors API:
curl.exe -s "http://localhost:3000/api/doctors" | findstr "John Smith"
if %errorlevel% equ 0 (
    echo ✅ Doctors API working - John Smith found
) else (
    echo ❌ Doctors API not working properly
)

echo.
echo 2. Testing Patients API:
curl.exe -s "http://localhost:3000/api/patients?limit=5" | findstr "first_name"
if %errorlevel% equ 0 (
    echo ✅ Patients API working
) else (
    echo ❌ Patients API not working
)

echo.
echo 3. Open appointment page in browser:
echo    http://localhost:3000/appointments/add
echo.
echo The doctor dropdown should now show:
echo - Dr. John Smith (selected by default)
echo - Dr. Sarah Johnson
echo - Dr. Michael Chen
echo - Plus many other doctors from the database
echo.
pause
