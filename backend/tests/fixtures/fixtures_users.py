import pytest
from src.users.models import Users, Permissions, Roles
from src.users.auth import hash_password


@pytest.fixture
def create_test_role(db_session):
    """Factory fixture to create a test role."""

    def _create(role_name="Dummy Role"):
        role = db_session.query(Roles).filter_by(role_name=role_name).first()
        if not role:
            role = Roles(role_name=role_name)
            db_session.add(role)
            db_session.commit()
            db_session.refresh(role)
        return role

    return _create


@pytest.fixture
def create_test_permission(db_session):
    """Factory fixture to create a test permission."""

    def _create(code="dummy:perm", name="Dummy Perm"):
        perm = db_session.query(Permissions).filter_by(code=code).first()
        if not perm:
            perm = Permissions(code=code, name=name)
            db_session.add(perm)
            db_session.commit()
            db_session.refresh(perm)
        return perm

    return _create


@pytest.fixture
def create_test_user(db_session):
    """Factory fixture to create a plain test user."""

    def _create(email="plain_user@test.pl", name="Plain", surname="User"):
        user = db_session.query(Users).filter_by(email=email).first()
        if not user:
            user = Users(
                email=email,
                password_hash="fake_hash",
                name=name,
                surname=surname,
                email_verified=True,
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
        return user

    return _create


@pytest.fixture
def create_auth_user(db_session):
    """Factory fixture to create a user with a valid hashed password for login tests."""

    def _create(email="login@test.pl", password="StrongPassword123!"):

        user = db_session.query(Users).filter_by(email=email).first()
        if not user:
            user = Users(
                email=email,
                password_hash=hash_password(password),
                name="Auth",
                surname="User",
                email_verified=True,
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
        return user, password

    return _create
