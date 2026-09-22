#!/usr/bin/env bash
set -e

# ==============================================================================
# Deployment Guide & Validator for RailOne on Render using render.yaml Blueprint
# ==============================================================================

echo "========================================================"
echo "  RailOne Render Blueprint Deployment Helper"
echo "========================================================"

if [ ! -f "render.yaml" ]; then
    echo "[ERROR] render.yaml not found in project root."
    exit 1
fi
echo "[SUCCESS] Found render.yaml blueprint."

if [ ! -f "backend/Dockerfile" ]; then
    echo "[ERROR] backend/Dockerfile not found."
    exit 1
fi
echo "[SUCCESS] Found backend/Dockerfile."

if [ ! -f "backend/entrypoint.sh" ]; then
    echo "[ERROR] backend/entrypoint.sh not found."
    exit 1
fi
echo "[SUCCESS] Found backend/entrypoint.sh."

echo ""
echo "Services configured in render.yaml:"
echo "  1. Web Service:   railone-backend (FastAPI in Docker, auto-migrates & auto-seeds)"
echo "  2. Database:      railone-postgres (PostgreSQL 15, railone_db)"
echo "  3. Cache:         railone-redis (Redis in-memory store)"
echo ""
echo "Steps to Deploy:"
echo "  1. Push code to GitHub: git push origin main"
echo "  2. Navigate to: https://dashboard.render.com/blueprints"
echo "  3. Click 'New Blueprint Instance' and select your repository."
echo "  4. Click 'Apply' — Render deploys all 3 services automatically."
