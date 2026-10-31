@echo off
title PawCircle — Starting...
color 0A

echo.
echo  ==========================================
echo    ___  __ ____  ___  _ ____   ___  __    ____
echo   / _ \/ _` \ \ / \ \/ / __| / _ \/ /   / __^|
echo  ^| (_) ^| (_^| ^|\ V / ^>  ^< (__  / (_) / /__ \__ \
echo   \___/ \__,_^| \_/ /_/\_\___^| \___/____/____/
echo.
echo   Find trusted care. Track every task.
echo  ==========================================
echo.

:: ── Change to the project directory ──────────────────────────
cd /d "D:\Pawcircle"

:: ── Check Node.js is installed ───────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: ── Check node_modules exists ─────────────────────────────────
if not exist "node_modules" (
    echo  [INFO] node_modules not found. Running npm install first...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo.
)

:: ── Start the frontend (Vite dev server) ──────────────────────
echo  [1/1] Starting PawCircle frontend...
echo        URL: http://localhost:5173
echo.
echo  ==========================================
echo   Press Ctrl+C to stop the server.
echo  ==========================================
echo.

:: Open browser after a short delay (2 seconds)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: Start Vite
call npm run dev

:: If server stops
echo.
echo  PawCircle has stopped.
pause

