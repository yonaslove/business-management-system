@echo off
title Launching Business Management System with Docker
echo ======================================================================
echo Starting Business Management System (PostgreSQL + FastAPI + Next.js)...
echo ======================================================================

echo.
echo Starting all containers with Docker Compose...
docker compose up -d

echo.
echo Checking running services:
docker compose ps

echo.
echo ======================================================================
echo System successfully running in Docker!
echo.
echo - Frontend Web App:     http://localhost:3000
echo - Backend API Docs:     http://localhost:8000/docs
echo - PostgreSQL Database:  localhost:5432 (Database: bms_db, User: bms_user)
echo.
echo To view logs: docker compose logs -f
echo To stop services: docker compose down
echo ======================================================================
pause
