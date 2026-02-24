@echo off
title Crediscout Master Launcher
echo ==========================================
echo    CREDISCOUT // AI CREDIT READINESS
echo ==========================================
echo.
echo [1/2] Launching Backend Process...
start "Crediscout Backend" powershell -NoExit -ExecutionPolicy Bypass -File .\run_backend.ps1

echo [2/2] Launching Frontend Process...
start "Crediscout Frontend" powershell -NoExit -ExecutionPolicy Bypass -File .\run_frontend.ps1

echo.
echo ==========================================
echo SERVICES STARTED. DO NOT CLOSE THIS WINDOW.
echo ==========================================
pause
