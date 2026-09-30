@echo off
title Launching Business Management System
echo ============================================================
echo Starting Business Management System (FastAPI + Next.js)...
echo ============================================================

cd /d "%~dp0backend"
start "BMS Backend (FastAPI on Port 8000)" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

cd /d "%~dp0frontend"
start "BMS Frontend (Next.js on Port 3000)" cmd /k "npm run dev"

echo.
echo Servers launched successfully in dedicated background windows!
echo - Backend API:  http://localhost:8000 (Swagger docs: http://localhost:8000/docs)
echo - Frontend App: http://localhost:3000
echo ============================================================
pause
