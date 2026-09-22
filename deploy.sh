#!/usr/bin/env bash
set -e

# ==============================================================================
# Unified RailOne Deployment Launcher for Railway, Render, or Docker Compose
# ==============================================================================

echo "========================================================"
echo "         RailOne Super App - Cloud Deployment           "
echo "========================================================"
echo ""
echo "Select a deployment target for Backend + PostgreSQL + Redis:"
echo ""
echo "  [1] Railway  - Automated CLI deploy (FastAPI + PostgreSQL + Redis)"
echo "  [2] Render   - Blueprint deployment via render.yaml (1-Click)"
echo "  [3] Docker   - Run full stack locally via docker-compose up"
echo "  [4] Exit"
echo ""

read -p "Enter option [1-4]: " choice

case "$choice" in
  1)
    bash scripts/deploy_railway.sh
    ;;
  2)
    bash scripts/deploy_render.sh
    ;;
  3)
    echo "Starting local Docker Compose stack..."
    docker-compose up --build
    ;;
  4)
    echo "Exiting."
    exit 0
    ;;
  *)
    echo "Invalid option."
    exit 1
    ;;
esac
