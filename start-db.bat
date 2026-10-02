@echo off
title Launching Docker PostgreSQL Database
echo ======================================================================
echo Starting PostgreSQL Container for Business Management System...
echo ======================================================================

docker compose up -d db

echo.
echo Database status:
docker compose ps db

echo.
echo PostgreSQL is running on port 5432!
echo Host: localhost:5432
echo Database: bms_db
echo User: bms_user
echo ======================================================================
pause
