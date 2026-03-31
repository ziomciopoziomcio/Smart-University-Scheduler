import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# SQLAlchemy
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5432"
os.environ["DB_USER"] = "test_user"
os.environ["DB_PASSWORD"] = "test_pass"
os.environ["DB_NAME"] = "test_db"

# Neo4j
os.environ["NEO4J_HOST"] = "localhost"
os.environ["NEO4J_PORT"] = "7687"
os.environ["NEO4J_USER"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "test_pass"

# Security & JWT
os.environ["SECRET_KEY"] = "very-very-very-strong-test-key-12345"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"

# SMTP & others
os.environ["SMTP_HOST"] = "localhost"
os.environ["SMTP_PORT"] = "587"
os.environ["SMTP_USER"] = "test@gmail.com"
os.environ["SMTP_PASSWORD"] = "pass"
os.environ["SMTP_FROM"] = "Test <no-reply@test.pl>"
os.environ["PUBLIC_BASE_URL"] = "http://localhost:3000"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"


from main import app
from src.database.database import get_db
from src.database.base import Base

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Sets up test DB. Executes once."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Sets up clear DB session. Executes before every test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Replaces FastApi's base with test client."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
