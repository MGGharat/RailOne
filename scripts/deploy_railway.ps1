<#
.SYNOPSIS
    Automated Deployment Script for RailOne Backend, PostgreSQL, and Redis onto Railway.
.DESCRIPTION
    Provisions a PostgreSQL database, Redis instance, and deploys the FastAPI backend container
    using backend/Dockerfile and railway.toml.
#>

param(
    [string]$ProjectName = "RailOne-Backend"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor White
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

Write-Step "RailOne Railway Automated Deployment"

# 1. Verify Railway CLI
Write-Info "Checking Railway CLI installation..."
$railwayCmd = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayCmd) {
    Write-Warn "Railway CLI is not installed on this system."
    Write-Host "You can install it using one of the following commands:" -ForegroundColor White
    Write-Host "  npm install -g @railway/cli" -ForegroundColor Cyan
    Write-Host "  winget install Railway.Railway" -ForegroundColor Cyan
    Write-Host "  irm https://railway.app/install.ps1 | iex`n" -ForegroundColor Cyan
    
    $installNow = Read-Host "Would you like to install Railway CLI via npm now? (Y/N)"
    if ($installNow -eq 'Y' -or $installNow -eq 'y') {
        npm install -g @railway/cli
        $railwayCmd = Get-Command railway -ErrorAction SilentlyContinue
    }
    
    if (-not $railwayCmd) {
        Write-Host "Please install Railway CLI and re-run this script." -ForegroundColor Red
        exit 1
    }
}
Write-Success "Railway CLI is available: $($railwayCmd.Source)"

# 2. Check Authentication
Write-Step "Step 1/5: Checking Railway Authentication"
try {
    $whoami = railway whoami 2>&1
    Write-Success "Authenticated as: $whoami"
} catch {
    Write-Info "Launching browser login..."
    railway login
}

# 3. Project Initialization / Linking
Write-Step "Step 2/5: Initializing Railway Project"
try {
    $status = railway status 2>&1
    Write-Info "Project already linked: $status"
} catch {
    Write-Info "Creating new Railway project '$ProjectName'..."
    railway init --name $ProjectName
}

# 4. Provision PostgreSQL & Redis plugins
Write-Step "Step 3/5: Provisioning PostgreSQL and Redis Services"
Write-Info "Adding PostgreSQL plugin..."
try {
    railway add -d postgres
    Write-Success "PostgreSQL service provisioned."
} catch {
    Write-Warn "PostgreSQL already added or skipping duplicate: $_"
}

Write-Info "Adding Redis plugin..."
try {
    railway add -d redis
    Write-Success "Redis service provisioned."
} catch {
    Write-Warn "Redis already added or skipping duplicate: $_"
}

# 5. Set Environment Variables
Write-Step "Step 4/5: Configuring Backend Environment Variables"
Write-Info "Setting backend configuration..."
try {
    railway variables --set REDIS_ENABLED=true
    railway variables --set "SECRET_KEY=railone-production-secret-jwt-key-2026-secure"
    railway variables --set "CORS_ORIGINS=https://railone-ten.vercel.app,https://railone-lilac.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
    Write-Success "Environment variables set."
} catch {
    Write-Warn "Variables configuration note: $_"
}

# 6. Deploy Backend Container
Write-Step "Step 5/5: Building & Deploying RailOne Backend"
Write-Info "Deploying backend using backend/Dockerfile..."
railway up --detach

# 7. Generate or Fetch Public Domain
Write-Info "Generating / checking public domain URL..."
try {
    $domain = railway domain 2>&1
    Write-Success "Public API Endpoint: $domain"
} catch {
    Write-Warn "Could not auto-generate domain. Run 'railway domain' or configure via Railway Dashboard."
}

Write-Step "Deployment Completed Successfully!"
Write-Host @"
Your RailOne services are live on Railway:
- FastAPI Backend: Deployed via backend/Dockerfile & railway.toml
- PostgreSQL DB:   Provisioned (DATABASE_URL linked automatically)
- Redis Cache:     Provisioned (REDIS_URL linked automatically)

Next Steps:
1. Open your Railway dashboard: 'railway open'
2. Copy your backend domain (e.g. https://railone-production.up.railway.app)
3. Set VITE_API_URL in your Vercel project environment variables:
   VITE_API_URL = https://your-railway-backend.up.railway.app
"@ -ForegroundColor Green
