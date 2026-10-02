@echo off
title Launching Business Management System
echo ======================================================================
echo Starting Business Management System (PostgreSQL in Docker + Local Dev)
echo ======================================================================

echo.
echo Step 1: Ensuring PostgreSQL database is active in Docker...
docker compose up -d db

echo.
echo Step 2: Starting FastAPI Backend (Port 8000)...
cd /d "%~dp0backend"
start "BMS Backend (FastAPI on Port 8000 - PostgreSQL)" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo Step 3: Starting Next.js Frontend (Port 3000)...
cd /d "%~dp0frontend"
start "BMS Frontend (Next.js on Port 3000)" cmd /k "npm run dev"

echo.
echo ======================================================================
echo System successfully launched!
echo - Database:     PostgreSQL (Docker container on port 5432)
echo - Backend API:  http://localhost:8000 (Swagger docs at /docs)
echo - Frontend App: http://localhost:3000
echo ======================================================================
pause
