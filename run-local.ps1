# Local Development Script for DIESEL Dashboard
# Runs both API and Dashboard servers

Write-Host "🚀 Starting DIESEL Local Development Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if npm is installed
$npmExists = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmExists) {
    Write-Host "Error: npm is not installed" -ForegroundColor Red
    exit 1
}

# Function to start API server
function Start-API {
    Write-Host "`nStarting API Server on port 3001..." -ForegroundColor Yellow
    $apiProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd api; npm run dev" -PassThru
    return $apiProcess
}

# Function to start Dashboard
function Start-Dashboard {
    Write-Host "Starting Dashboard on port 5173..." -ForegroundColor Yellow
    $dashboardProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd dashboard; npm run dev" -PassThru
    return $dashboardProcess
}

# Install dependencies if needed
Write-Host "Checking dependencies..." -ForegroundColor White

if (-not (Test-Path "api/node_modules")) {
    Write-Host "Installing API dependencies..." -ForegroundColor Yellow
    Set-Location -Path "api"
    npm install
    Set-Location -Path ".."
}

if (-not (Test-Path "dashboard/node_modules")) {
    Write-Host "Installing Dashboard dependencies..." -ForegroundColor Yellow
    Set-Location -Path "dashboard"
    npm install
    Set-Location -Path ".."
}

# Start both servers
$apiProcess = Start-API
Start-Sleep -Seconds 2
$dashboardProcess = Start-Dashboard

Write-Host "`n✅ Local environment started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "API Server:  http://localhost:3001" -ForegroundColor White
Write-Host "Dashboard:   http://localhost:5173" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop all servers" -ForegroundColor Yellow

# Wait for user to stop
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    if ($apiProcess -and !$apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force
    }
    if ($dashboardProcess -and !$dashboardProcess.HasExited) {
        Stop-Process -Id $dashboardProcess.Id -Force
    }
    Write-Host "Servers stopped." -ForegroundColor Green
}