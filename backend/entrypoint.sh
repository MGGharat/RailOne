#!/bin/sh
set -e

echo "================================================="
echo "   RailOne Backend Container Starting...        "
echo "================================================="

# Convert postgres:// to postgresql:// if needed
if [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    postgres://*)
      export DATABASE_URL="postgresql://${DATABASE_URL#postgres://}"
      echo "Normalized DATABASE_URL scheme to postgresql://"
      ;;
  esac
fi

# If using PostgreSQL, wait until database is accepting connections
if echo "$DATABASE_URL" | grep -q "postgres"; then
  echo "Checking PostgreSQL database connectivity..."
  python - <<'EOF'
import os, sys, time
db_url = os.environ.get("DATABASE_URL", "")
if db_url:
    try:
        import psycopg2
        for i in range(30):
            try:
                conn = psycopg2.connect(db_url)
                conn.close()
                print("PostgreSQL connection confirmed.")
                sys.exit(0)
            except Exception as e:
                print(f"Waiting for PostgreSQL... ({i+1}/30) - {e}")
                time.sleep(2)
        print("Timeout waiting for PostgreSQL, proceeding anyway...")
    except ImportError:
        print("psycopg2 not found, skipping pre-flight check.")
EOF
fi

# Apply database migrations
echo "Applying database migrations..."
if alembic upgrade head; then
  echo "Alembic migrations applied successfully."
else
  echo "Alembic migration failed or not configured, initializing tables via SQLAlchemy Base..."
  python -c "from app.core.database import Base, engine; import app.models.models; Base.metadata.create_all(bind=engine)"
fi

# Seed initial stations, trains, coaches, fares, and demo users if database is fresh
echo "Checking and seeding initial database records..."
python -m app.seed.run_seed || echo "Seed completed or records already exist."

# Start uvicorn server on dynamic PORT (Render sets PORT=10000, Railway assigns PORT, default 8000)
PORT="${PORT:-8000}"
echo "Starting RailOne backend server on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
