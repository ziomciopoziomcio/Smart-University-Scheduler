import pytest
from pydantic import ValidationError

from src.conversations.schemas import ChatCreate, MessageCreate
from src.conversations.models import MessageRole

# ==========================================
# TESTS: Chat (Field limits)
# ==========================================


def test_chat_title_max_length():
    """Tests if the chat title respects the maximum length of 255 characters."""
    # Valid: Exactly 255 characters
    valid_title = "a" * 255
    chat = ChatCreate(title=valid_title)
    assert chat.title == valid_title

    # Invalid: 256 characters (exceeds limit)
    invalid_title = "a" * 256
    with pytest.raises(ValidationError) as exc:
        ChatCreate(title=invalid_title)
    assert "String should have at most 255 characters" in str(exc.value)


# ==========================================
# TESTS: Message (Field limits and Enums)
# ==========================================


def test_message_content_min_length():
    """Tests if the message content strictly requires at least 1 character."""
    # Invalid: Empty string
    with pytest.raises(ValidationError) as exc:
        MessageCreate(content="")
    assert "String should have at least 1 character" in str(exc.value)

    # Valid: At least 1 character
    msg = MessageCreate(content="?")
    assert msg.content == "?"


def test_message_role_assignment():
    """Tests the default role fallback and rejects invalid enum role assignments."""
    # Valid: Default role should automatically fall back to USER
    msg_default = MessageCreate(content="Hello world!")
    assert msg_default.role == MessageRole.USER

    # Valid: Explicitly assigning ASSISTANT
    msg_assistant = MessageCreate(role=MessageRole.ASSISTANT, content="How can I help?")
    assert msg_assistant.role == MessageRole.ASSISTANT

    # Invalid: Assigning a non-existent role that is not in the MessageRole Enum
    with pytest.raises(ValidationError) as exc:
        MessageCreate(role="superadmin", content="This should fail")
    assert "Input should be" in str(exc.value)
