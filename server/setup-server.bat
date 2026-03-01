@echo off
echo ========================================
echo Medical Records Center Server Setup
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

:: Create directories
echo Creating directories...
mkdir "C:\MedicalRecordsCenter" 2>nul
mkdir "C:\MedicalRecordsCenter\database" 2>nul
mkdir "C:\MedicalRecordsCenter\logs" 2>nul
mkdir "C:\MedicalRecordsCenter\backups" 2>nul
mkdir "C:\MedicalRecordsCenter\uploads" 2>nul
mkdir "C:\MedicalRecordsCenter\temp" 2>nul

:: Install Chocolatey if not present
echo Checking for Chocolatey...
where choco >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Chocolatey...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    set PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
    refreshenv
)

:: Install SQL Server Express
echo Installing SQL Server Express...
choco install sql-server-express -y
choco install sql-server-management-studio -y

:: Install Node.js
echo Installing Node.js...
choco install nodejs -y

:: Install Git
echo Installing Git...
choco install git -y

:: Install IIS features
echo Installing IIS features...
dism /online /enable-feature /featurename:IIS-WebServerRole /all /norestart
dism /online /enable-feature /featurename:IIS-WebServer /all /norestart
dism /online /enable-feature /featurename:IIS-ASPNET45 /all /norestart

:: Configure firewall
echo Configuring firewall...
netsh advfirewall firewall add rule name="Medical Records Center - HTTP" dir=in action=allow protocol=TCP localport=80 enable=yes
netsh advfirewall firewall add rule name="Medical Records Center - HTTPS" dir=in action=allow protocol=TCP localport=443 enable=yes
netsh advfirewall firewall add rule name="Medical Records Center - SQL" dir=in action=allow protocol=TCP localport=1433 enable=yes

:: Create database
echo Creating database...
sqlcmd -S localhost\SQLEXPRESS -E -Q "CREATE DATABASE MedicalRecordsDB" 2>nul

:: Run database schema
echo Creating database schema...
sqlcmd -S localhost\SQLEXPRESS -E -d MedicalRecordsDB -i "database-schema.sql"

:: Generate sample data
echo Generating sample data...
python sample-data-generator.py

:: Create Windows service
echo Creating Windows service...
sc create "MedicalRecordsCenter" binPath= "C:\MedicalRecordsCenter\MedicalRecordsCenter.Server.exe" start= auto
sc description "Medical Records Center Server" "Medical Records Center data server service"

:: Start service
echo Starting service...
sc start "MedicalRecordsCenter"

:: Configure IIS
echo Configuring IIS...
%windir%\system32\inetsrv\appcmd add site /name:"Medical Records Center" /bindings:"http/*:80:" /physicalPath:"C:\MedicalRecordsCenter"
%windir%\system32\inetsrv\appcmd add apppool /name:"MedicalRecordsCenterPool" /managedRuntimeVersion:"v4.0"
%windir%\system32\inetsrv\appcmd set app "Medical Records Center/" /applicationPool:"MedicalRecordsCenterPool"

:: Set permissions
echo Setting permissions...
icacls "C:\MedicalRecordsCenter" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\MedicalRecordsCenter" /grant "IUSR:(OI)(CI)F" /T
icacls "C:\MedicalRecordsCenter\database" /grant "NETWORK SERVICE:(OI)(CI)F" /T

:: Create desktop shortcut
echo Creating desktop shortcut...
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Medical Records Center.lnk'); $Shortcut.TargetPath = 'C:\MedicalRecordsCenter\MedicalRecordsCenter.Server.exe'; $Shortcut.Save()"

:: Configure startup
echo Adding to startup...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "MedicalRecordsCenter" /t REG_SZ /d "C:\MedicalRecordsCenter\MedicalRecordsCenter.Server.exe" /f

echo.
echo ========================================
echo Server setup complete!
echo ========================================
echo.
echo Server URL: http://localhost
echo Database: localhost\SQLEXPRESS
echo Logs: C:\MedicalRecordsCenter\logs
echo Backups: C:\MedicalRecordsCenter\backups
echo.
echo Press any key to open server dashboard...
pause >nul
start http://localhost

echo Server setup completed successfully!
pause
