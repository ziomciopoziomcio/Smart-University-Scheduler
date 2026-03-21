"""
Tables:
- messages
- chats
"""

import enum


class MessageRole(str, enum.Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
