# Run the Crediscout Backend
Write-Host "Starting Crediscout Backend on http://localhost:8001..." -ForegroundColor Cyan
$env:PYTHONPATH = (Get-Location).Path
py -3.12 -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
