import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.seed.run_seed import seed_database
from app.core.security import create_access_token
from app.models.models import User

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    seed_database()
    yield

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def user_token(client):
    db = SessionLocal()
    user = db.query(User).filter(User.email == "user@railone.demo").first()
    db.close()
    token = create_access_token(user.id)
    return token

@pytest.fixture
def admin_token(client):
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@railone.demo").first()
    db.close()
    token = create_access_token(admin.id)
    return token

@pytest.fixture
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
