@echo off
echo ========================================================
echo Starting E-Learning Education System (ELES)
echo ========================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ELES Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo Starting React (Vite) Frontend on http://localhost:5173 ...
start "ELES Frontend (React)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo ========================================================
echo ELES is starting!
echo Frontend: http://localhost:5173
echo Backend API: http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause
