@echo off
REM Auto-start the DocSaaS local stack (Postgres, Redis, API, frontend) at Windows login.
REM Idempotent: does nothing for services already running.
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "E:\Applications\OfficeTemp\start-stack.ps1"
