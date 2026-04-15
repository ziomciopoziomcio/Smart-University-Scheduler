from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)
from . import models, schemas
from ..database.database import get_db
from ..database.neo4j import get_neo4j_session
from ..rag.retriever import get_user_schedule_context
from ..users.auth import get_current_user
from ..users.models import Users
from ..common.require_permission import require_permission
from ..users import models as user_models

from src.rag.llm_agent import process_chat_message
from src.schedules.models import ScheduleSuggestion, SuggestionStatus

router = APIRouter(prefix="/chats", tags=["chats"])

CHAT_LIMIT = 50
MESSAGE_LIMIT = 100


# Chats
@router.post("/", response_model=schemas.ChatRead, status_code=status.HTTP_201_CREATED)
def create_chat(
    payload: schemas.ChatCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("chat:create")),
):
    obj = models.Chats(user_id=current_user.id, **payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/", response_model=PaginatedResponse[schemas.ChatRead])
def list_chats(
    limit: int | None = Query(CHAT_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("chats:view")),
):
    query = db.query(models.Chats)
    query = query.filter(
        models.Chats.user_id == current_user.id,
        models.Chats.visible.is_(True),
    )

    return paginate(query, limit, offset, models.Chats.created_at.desc())


@router.get("/{chat_id}", response_model=schemas.ChatRead)
def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("chat:view")),
):
    obj = _get_or_404(db, models.Chats, chat_id, "Chat")

    if obj.user_id != current_user.id or not obj.visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    return obj


@router.patch("/{chat_id}", response_model=schemas.ChatRead)
def update_chat(
    chat_id: int,
    payload: schemas.ChatUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("chat:update")),
):
    obj = _get_or_404(db, models.Chats, chat_id, "Chat")

    if obj.user_id != current_user.id or not obj.visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"title"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("chat:delete")),
):
    obj = _get_or_404(db, models.Chats, chat_id, "Chat")

    if obj.user_id != current_user.id or not obj.visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    obj.visible = False
    db.add(obj)
    _commit_or_rollback(db)
    return None


# Messages
@router.post(
    "/{chat_id}/messages",
    response_model=schemas.MessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    chat_id: int,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    neo4j_session=Depends(get_neo4j_session),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("message:create")),
):
    chat = _get_or_404(db, models.Chats, chat_id, "Chat")

    if chat.user_id != current_user.id or not chat.visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    user_msg = models.Messages(chat_id=chat_id, **payload.model_dump())
    db.add(user_msg)
    db.flush()

    user_context = await get_user_schedule_context(current_user.id, neo4j_session)

    agent_response = process_chat_message(payload.content, user_context)

    ai_msg = models.Messages(
        chat_id=chat_id,
        role=models.MessageRole.ASSISTANT,
        content=agent_response["content"],
    )
    db.add(ai_msg)

    if agent_response["type"] == "tool_call":
        sugg_data = agent_response["suggestion_data"]

        new_suggestion = ScheduleSuggestion(
            source="AI_CHAT",
            reason=sugg_data["reason"],
            target_class_session_id=sugg_data["target_class_session_id"],
            state_before={
                "info": "Data to be fetched from scheduler",
                "context_snapshot": user_context,
            },
            state_after={
                "proposed_timeslot_id": sugg_data.get("proposed_timeslot_id"),
                "proposed_room_id": sugg_data.get("proposed_room_id"),
            },
            status=SuggestionStatus.PENDING,
        )
        db.add(new_suggestion)

    _commit_or_rollback(db)
    db.refresh(ai_msg)

    return ai_msg


@router.get(
    "/{chat_id}/messages", response_model=PaginatedResponse[schemas.MessageRead]
)
def list_messages(
    chat_id: int,
    limit: int | None = Query(MESSAGE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("messages:view")),
):
    chat = _get_or_404(db, models.Chats, chat_id, "Chat")

    if chat.user_id != current_user.id or not chat.visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    query = db.query(models.Messages).filter(models.Messages.chat_id == chat_id)

    return paginate(query, limit, offset, models.Messages.created_at.asc())
