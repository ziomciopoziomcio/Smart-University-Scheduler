from typing import Callable

from sqlalchemy.orm import Session

from src.users.models import Users


def create_user_admin(
    session: Session,
    password_hash_func: Callable[[str], str] | None,
):
    if password_hash_func is None:

        def not_a_hash(text: str) -> str:
            return text

        password_hash_func = not_a_hash

    mail = "admin@nimda@pl"
    password = "qwerty"
    password_hash = password_hash_func(password)
    name = "Admin"
    surname = "Adminkowski"
    Users(
        password_hash=password_hash,
        email=mail,
        phone_number="123456789",
        name=name,
        surname=surname,
        degree=None,
        # roles=[curr_role_obj],
        email_verified=True,
    )
    # todo roles
