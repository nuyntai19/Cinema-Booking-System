@echo off
echo Syncing backend files from project to XAMPP...
xcopy /Y /S "D:\webNangCao(PHP)\GalaxyCinema_Project\backend\*" "C:\xampp\htdocs\backend\"
echo Done! All backend files synced.
pause
