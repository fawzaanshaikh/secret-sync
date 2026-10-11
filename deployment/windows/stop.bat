@echo off
rem Double-click entry point for stop.ps1. Runs the real script with a one-off
rem execution-policy bypass so nobody has to change system PowerShell settings.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
pause
