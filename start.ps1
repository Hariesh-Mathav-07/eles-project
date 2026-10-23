Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting E-Learning Education System (ELES)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; python -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 2

Write-Host "Starting React (Vite) Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm.cmd run dev"

Write-Host ""
Write-Host "ELES is launching!" -ForegroundColor Yellow
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "API Docs:    http://127.0.0.1:8000/docs" -ForegroundColor White
