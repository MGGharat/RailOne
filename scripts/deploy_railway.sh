#!/usr/bin/env bash
set -e

# ==============================================================================
# Automated Deployment Script for RailOne Backend, PostgreSQL & Redis onto Railway
# ==============================================================================

PROJECT_NAME="${1:-RailOne-Backend}"

echo "========================================================"
echo "  RailOne Railway Automated Deployment"
echo "========================================================"

# 1. Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "[WARNING] Railway CLI is not installed."
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo "  or: curl -fsSL https://railway.app/install.sh | sh"
    read -p "Would you like to install via npm now? (y/N): " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        npm install -g @railway/cli
    else
        echo "Please install Railway CLI and rerun."
        exit 1
    fi
fi

# 2. Login
echo "[INFO] Verifying Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "[INFO] Authenticating to Railway..."
    railway login
fi

# 3. Project initialization
echo "[INFO] Checking project link status..."
if ! railway status &> /dev/null; then
    echo "[INFO] Creating project $PROJECT_NAME..."
    railway init --name "$PROJECT_NAME"
fi

# 4. Add PostgreSQL
echo "[INFO] Provisioning PostgreSQL plugin..."
railway add -d postgres || echo "Postgres already added or skipping."

# 5. Add Redis
echo "[INFO] Provisioning Redis plugin..."
railway add -d redis || echo "Redis already added or skipping."

# 6. Set environment variables
echo "[INFO] Setting environment variables..."
railway variables --set REDIS_ENABLED=true || true
railway variables --set SECRET_KEY="railone-production-secret-jwt-key-2026-secure" || true
railway variables --set CORS_ORIGINS="https://railone-ten.vercel.app,https://railone-lilac.vercel.app,http://localhost:5173,http://127.0.0.1:5173" || true

# 7. Build and deploy
echo "[INFO] Deploying backend Docker container..."
railway up --detach

# 8. Domain
echo "[INFO] Checking / generating public domain..."
railway domain || true

echo "========================================================"
echo "  RailOne Backend Deployed Successfully to Railway!    "
echo "========================================================"
echo "Run 'railway open' to view your services in the web console."
