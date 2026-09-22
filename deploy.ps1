<#
.SYNOPSIS
    Unified RailOne Deployment Launcher for Railway, Render, or Docker Compose.
#>

$ErrorActionPreference = "Stop"

Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         RailOne Super App - Cloud Deployment           " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Select a deployment target for Backend + PostgreSQL + Redis:" -ForegroundColor White
Write-Host ""
Write-Host "  [1] Railway  - Automated CLI deploy (FastAPI + PostgreSQL + Redis)" -ForegroundColor Green
Write-Host "  [2] Render   - Blueprint deployment via render.yaml (1-Click)" -ForegroundColor Green
Write-Host "  [3] Docker   - Run full stack locally via docker-compose up" -ForegroundColor Cyan
Write-Host "  [4] Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter option [1-4]"

switch ($choice) {
    "1" {
        & "$PSScriptRoot\scripts\deploy_railway.ps1"
    }
    "2" {
        & "$PSScriptRoot\scripts\deploy_render.ps1"
    }
    "3" {
        Write-Host "`nStarting local Docker Compose stack..." -ForegroundColor Cyan
        docker-compose up --build
    }
    "4" {
        Write-Host "Exiting." -ForegroundColor Gray
        exit 0
    }
    Default {
        Write-Host "Invalid option. Exiting." -ForegroundColor Red
        exit 1
    }
}
