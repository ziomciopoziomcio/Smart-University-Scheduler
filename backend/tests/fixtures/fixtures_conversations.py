import pytest
from src.conversations.models import Chats, Messages, MessageRole


@pytest.fixture
def create_test_chat(db_session, create_test_user):
    """Factory fixture to create a test chat assigned to a specific user."""

    def _create(
        user_email="default_chat_user@test.pl", title="Test Chat", visible=True
    ):
        user = create_test_user(email=user_email)
        chat = Chats(user_id=user.id, title=title, visible=visible)
        db_session.add(chat)
        db_session.commit()
        db_session.refresh(chat)
        return chat

    return _create


@pytest.fixture
def create_test_message(db_session, create_test_chat):
    """Factory fixture to create a test message."""

    def _create(
        user_email="default_chat_user@test.pl", chat_id=None, content="Hello World"
    ):
        if chat_id is None:
            chat = create_test_chat(user_email=user_email)
            chat_id = chat.id

        message = Messages(chat_id=chat_id, role=MessageRole.USER, content=content)
        db_session.add(message)
        db_session.commit()
        db_session.refresh(message)
        return message

    return _create
