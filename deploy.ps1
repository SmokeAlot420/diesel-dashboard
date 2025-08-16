# DIESEL Dashboard & API Deployment Script for Windows
# Production deployment to Vercel

Write-Host "🚀 DIESEL Production Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if Vercel CLI is installed
$vercelExists = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelExists) {
    Write-Host "Error: Vercel CLI is not installed" -ForegroundColor Red
    Write-Host "Install it with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

# Function to deploy API
function Deploy-API {
    Write-Host "`nDeploying API Server..." -ForegroundColor Yellow
    Set-Location -Path "api"
    
    # Install dependencies
    Write-Host "Installing API dependencies..." -ForegroundColor White
    npm install
    
    # Build TypeScript
    Write-Host "Building API..." -ForegroundColor White
    npm run build
    
    # Deploy to Vercel
    Write-Host "Deploying API to Vercel..." -ForegroundColor White
    vercel --prod
    
    Set-Location -Path ".."
    Write-Host "✓ API deployed successfully" -ForegroundColor Green
}

# Function to deploy Dashboard
function Deploy-Dashboard {
    Write-Host "`nDeploying Dashboard..." -ForegroundColor Yellow
    Set-Location -Path "dashboard"
    
    # Install dependencies
    Write-Host "Installing dashboard dependencies..." -ForegroundColor White
    npm install
    
    # Build for production
    Write-Host "Building dashboard..." -ForegroundColor White
    npm run build
    
    # Deploy to Vercel
    Write-Host "Deploying dashboard to Vercel..." -ForegroundColor White
    vercel --prod
    
    Set-Location -Path ".."
    Write-Host "✓ Dashboard deployed successfully" -ForegroundColor Green
}

# Main deployment flow
Write-Host "What would you like to deploy?" -ForegroundColor Cyan
Write-Host "1) API Server only" -ForegroundColor White
Write-Host "2) Dashboard only" -ForegroundColor White
Write-Host "3) Both API and Dashboard" -ForegroundColor White
$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Deploy-API
    }
    "2" {
        Deploy-Dashboard
    }
    "3" {
        Deploy-API
        Deploy-Dashboard
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Update CORS_ORIGIN in API settings" -ForegroundColor White
Write-Host "3. Update VITE_API_BASE_URL in dashboard settings" -ForegroundColor White
Write-Host "4. Test the production deployment" -ForegroundColor White