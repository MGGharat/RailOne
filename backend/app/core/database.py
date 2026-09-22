from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    if ":///" in db_url:
        path_part = db_url.split(":///", 1)[1]
        if path_part.startswith("./") or not Path(path_part).is_absolute():
            clean_rel = path_part.lstrip("./")
            abs_db_path = (BACKEND_DIR / clean_rel).resolve()
            db_url = f"sqlite:///{abs_db_path.as_posix()}"

is_sqlite = db_url.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=15,
        max_overflow=10
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
