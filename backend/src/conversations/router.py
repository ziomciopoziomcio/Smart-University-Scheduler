import asyncio
import uuid

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
from ..database.neo4j import get_neo4j_session, check_availability_in_neo4j
from ..rag.retriever import get_user_schedule_context
from ..users.auth import get_current_user
from ..users.models import Users
from ..common.require_permission import require_permission
from ..users import models as user_models

from src.rag.llm_agent import process_chat_message, get_system_prompt
from src.database.database import SessionLocal
from src.schedules import models as schedule_models

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
    response_model=schemas.ChatTurnResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    chat_id: int,
    payload: schemas.MessageCreate,
    neo4j_session=Depends(get_neo4j_session),
    current_user: Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("message:create")),
):
    def save_user_context_task():
        with SessionLocal() as local_db:
            chat = _get_or_404(local_db, models.Chats, chat_id, "Chat")

            if chat.user_id != current_user.id or not chat.visible:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
                )

            user_msg = models.Messages(chat_id=chat_id, **payload.model_dump())
            local_db.add(user_msg)
            _commit_or_rollback(local_db)
            local_db.refresh(user_msg)

            employee = (
                local_db.query(user_models.Employees)
                .filter(user_models.Employees.user_id == current_user.id)
                .first()
            )
            schedule_user_id = employee.id if employee is not None else current_user.id
            user_msg_schema = schemas.MessageRead.model_validate(user_msg)
            return user_msg_schema, schedule_user_id

    user_msg_schema, schedule_user_id = await asyncio.to_thread(save_user_context_task)

    user_context = await get_user_schedule_context(schedule_user_id, neo4j_session)

    messages = [
        {"role": "system", "content": get_system_prompt(user_context)},
        {"role": "user", "content": payload.content},
    ]
    final_content = "Something went wrong."
    suggestion_data = None
    max_iterations = 5

    while max_iterations > 0:
        max_iterations -= 1

        agent_response = await asyncio.to_thread(process_chat_message, messages)
        if agent_response["type"] == "text":
            final_content = agent_response["content"]
            break
        elif agent_response["type"] == "tool_call":
            tool_name = agent_response["tool_name"]
            args = agent_response["arguments"]

            messages.append(agent_response["raw_message"])

            if tool_name == "check_availability":
                result_str = await check_availability_in_neo4j(
                    args.get("session_id"),
                    args.get("proposed_timeslot_id"),
                    neo4j_session,
                )
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": agent_response["tool_call_id"],
                        "content": result_str,
                    }
                )
                continue
            elif tool_name == "create_reschedule_suggestion":
                target_id = args.get("target_class_session_id")
                valid_uuid = None
                if target_id:
                    try:
                        valid_uuid = uuid.UUID(target_id)
                    except (ValueError, TypeError, AttributeError):
                        pass
                if not valid_uuid:
                    suggestion_data = None
                    final_content = (
                        "Sorry, but I cannot process your rescheduling request "
                        "because the target class session ID is missing or invalid."
                        "Please check the prompt and try again."
                    )
                    break
                suggestion_data = args
                suggestion_data["_validaten_uuid"] = valid_uuid
                final_content = args.get(
                    "confirmation_message",
                    "Schedule change suggestion has been submitted.",
                )
                break

    def save_ai_response_task():
        with SessionLocal() as local_db:
            if suggestion_data and "_validaten_uuid" in suggestion_data:
                new_suggestion = schedule_models.ScheduleSuggestion(
                    source="AI_CHAT",
                    reason=suggestion_data.get(
                        "reason", "Reschedule requested by AI Assistant"
                    ),
                    target_class_session_id=suggestion_data["_validaten_uuid"],
                    state_before={
                        "info": "Validated by Neo4j",
                        "context_snapshot": user_context,
                    },
                    state_after={
                        "proposed_timeslot_id": suggestion_data.get(
                            "proposed_timeslot_id"
                        ),
                        "proposed_room_id": suggestion_data.get("proposed_room_id"),
                    },
                    status=schedule_models.SuggestionStatus.PENDING,
                )
                local_db.add(new_suggestion)

            ai_msg = models.Messages(
                chat_id=chat_id,
                role=models.MessageRole.ASSISTANT,
                content=final_content,
            )
            local_db.add(ai_msg)
            _commit_or_rollback(local_db)
            local_db.refresh(ai_msg)

            return schemas.MessageRead.model_validate(ai_msg)

    ai_msg_schema = await asyncio.to_thread(save_ai_response_task)

    return {"user_message": user_msg_schema, "ai_message": ai_msg_schema}


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
