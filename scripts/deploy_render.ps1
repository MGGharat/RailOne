<#
.SYNOPSIS
    Deployment Guide and Helper for RailOne on Render using render.yaml Blueprint.
.DESCRIPTION
    Validates render.yaml blueprint configuration, ensures Dockerfile and entrypoint.sh
    are ready, and provides 1-click deployment options.
#>

param(
    [string]$RepoUrl = ""
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

Write-Step "RailOne Render Blueprint Deployment Helper"

# 1. Check local files
Write-Info "Checking Render configuration files..."

if (-not (Test-Path "render.yaml")) {
    Write-Host "Error: render.yaml not found in project root." -ForegroundColor Red
    exit 1
}
Write-Success "Found render.yaml Blueprint specification."

if (-not (Test-Path "backend/Dockerfile")) {
    Write-Host "Error: backend/Dockerfile not found." -ForegroundColor Red
    exit 1
}
Write-Success "Found backend/Dockerfile."

if (-not (Test-Path "backend/entrypoint.sh")) {
    Write-Host "Error: backend/entrypoint.sh not found." -ForegroundColor Red
    exit 1
}
Write-Success "Found backend/entrypoint.sh."

# 2. Display Blueprint Services
Write-Step "Services Defined in render.yaml"
Write-Host @"
1. Web Service:      railone-backend (Docker runtime from ./backend/Dockerfile)
   - Dynamic PORT:   10000 (handled automatically by entrypoint.sh)
   - Health check:   /health
   - Auto-migrates:  alembic upgrade head on start
   - Auto-seeds:     demo stations, trains, coaches, fares, and users

2. PostgreSQL DB:    railone-postgres (PostgreSQL 15)
   - Database name:  railone_db
   - User:           rail_user

3. Redis Cache:      railone-redis (In-memory store)
   - Interconnected: Linked to backend via REDIS_URL
"@ -ForegroundColor Cyan

# 3. How to Deploy to Render
Write-Step "How to Deploy to Render in 3 Steps"
Write-Host @"
Step 1: Push your latest changes to GitHub:
   git add .
   git commit -m "feat: add render.yaml blueprint and docker entrypoint"
   git push origin main

Step 2: Go to Render Dashboard:
   https://dashboard.render.com/blueprints

Step 3: Click 'New Blueprint Instance'
   - Connect your GitHub repository.
   - Render will read 'render.yaml' and display all 3 services automatically!
   - Click 'Apply'.
   - Render provisions PostgreSQL, Redis, and builds the backend container.
"@ -ForegroundColor Green

if ($RepoUrl) {
    $deployUrl = "https://render.com/deploy?repo=$RepoUrl"
    Write-Host "`nDirect 1-Click Deploy Link:" -ForegroundColor Yellow
    Write-Host $deployUrl -ForegroundColor Cyan
    
    $openNow = Read-Host "`nOpen Render in your default browser now? (Y/N)"
    if ($openNow -eq 'Y' -or $openNow -eq 'y') {
        Start-Process $deployUrl
    }
} else {
    $openNow = Read-Host "`nOpen Render Blueprints dashboard in browser? (Y/N)"
    if ($openNow -eq 'Y' -or $openNow -eq 'y') {
        Start-Process "https://dashboard.render.com/blueprints"
    }
}
