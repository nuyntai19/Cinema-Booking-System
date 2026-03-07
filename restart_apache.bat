@echo off
echo Stopping XAMPP Apache...
taskkill /F /IM httpd.exe
timeout /t 2
echo Starting XAMPP Apache...
start "" "C:\xampp\apache\bin\httpd.exe"
echo Done! Please wait 3 seconds for Apache to fully start.
timeout /t 3
