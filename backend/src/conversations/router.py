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


def _save_user_msg_sync(
    chat_id: int, user_id: int, payload: schemas.MessageCreate
) -> tuple[schemas.MessageRead, int]:
    """
    Save the user's message to the database and return the saved message along with the user ID to be used for scheduling context retrieval.
    :param chat_id: Value of the chat_id path parameter from the API endpoint
    :param user_id: ID of the current user, used to verify chat ownership and for scheduling context retrieval
    :param payload: The validated request body containing the user's message content and role
    :return: A tuple containing the saved user message as a Pydantic schema and the user ID for scheduling context retrieval
    """
    with SessionLocal() as local_db:
        chat = _get_or_404(local_db, models.Chats, chat_id, "Chat")
        if chat.user_id != user_id or not chat.visible:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
            )

        user_msg = models.Messages(chat_id=chat_id, **payload.model_dump())
        local_db.add(user_msg)
        _commit_or_rollback(local_db)
        local_db.refresh(user_msg)

        employee = (
            local_db.query(user_models.Employees)
            .filter(user_models.Employees.user_id == user_id)
            .first()
        )
        schedule_user_id = employee.id if employee is not None else user_id

        return schemas.MessageRead.model_validate(user_msg), schedule_user_id


def _save_ai_msg_sync(
    chat_id: int, content: str, sugg_data: dict | None, context: str
) -> schemas.MessageRead:
    """
    Save the AI assistant's message to the database, along with any schedule suggestion data if applicable.
    This function is designed to be run in a separate thread to avoid blocking the main event loop.
    :param chat_id: Value of the chat_id path parameter from the API endpoint, used to associate the AI message with the correct chat
    :param content: The final content of the AI assistant's message to be saved in the database
    :param sugg_data: A dictionary containing schedule suggestion data if the AI's response included a rescheduling suggestion.
    This may include reason, proposed timeslot and room IDs, and a validated UUID for the target class session.
    If no suggestion is included, this will be None.
    :param context: A snapshot of the user's scheduling context at the time of the AI's response,
    which will be stored in the state_before field of any created schedule suggestion for reference during review.
    This should be a string representation of the relevant scheduling information that was provided to the AI agent as part of the system prompt.
    :return:
    """
    with SessionLocal() as local_db:
        if sugg_data and "_validated_uuid" in sugg_data:
            new_suggestion = schedule_models.ScheduleSuggestion(
                source="AI_CHAT",
                reason=sugg_data.get("reason", "Reschedule requested by AI Assistant"),
                target_class_session_id=sugg_data["_validated_uuid"],
                state_before={
                    "info": "Validated by Neo4j",
                    "context_snapshot": context,
                },
                state_after={
                    "proposed_timeslot_id": sugg_data.get("proposed_timeslot_id"),
                    "proposed_room_id": sugg_data.get("proposed_room_id"),
                },
                status=schedule_models.SuggestionStatus.PENDING,
            )
            local_db.add(new_suggestion)

        ai_msg = models.Messages(
            chat_id=chat_id, role=models.MessageRole.ASSISTANT, content=content
        )
        local_db.add(ai_msg)
        _commit_or_rollback(local_db)
        local_db.refresh(ai_msg)

        return schemas.MessageRead.model_validate(ai_msg)


async def _process_llm_tool_chain(
    messages: list, neo4j_session
) -> tuple[str, dict | None]:
    """
    Process the chain of LLM responses and tool calls until a final text response is obtained or a maximum number of iterations is reached.
    This function handles the interaction with the LLM agent,
    including processing tool calls such as checking availability in Neo4j and creating schedule suggestions.
    :param messages: A list of message dictionaries representing the conversation history, which will be passed to the LLM agent for context.
    This list will be updated with tool call results as needed.
    :param neo4j_session: A Neo4j session object that can be used to execute queries against the Neo4j database
    when processing tool calls from the LLM agent. This is passed in to allow for asynchronous processing of tool calls without blocking the main event loop.
    :return: A tuple containing the final content of the AI assistant's message (which may be a confirmation message if a schedule suggestion was created)
    and a dictionary of schedule suggestion data if a suggestion was created, or None if no suggestion was created.
    """
    final_content = "Something went wrong."
    suggestion_data = None

    for _ in range(5):
        resp = await asyncio.to_thread(process_chat_message, messages)

        if resp["type"] == "text":
            final_content = resp["content"]
            break

        tool_name, args = resp.get("tool_name"), resp.get("arguments", {})
        messages.append(resp["raw_message"])

        if tool_name == "check_availability":
            res = await check_availability_in_neo4j(
                args.get("session_id"), args.get("proposed_timeslot_id"), neo4j_session
            )
            messages.append(
                {"role": "tool", "tool_call_id": resp["tool_call_id"], "content": res}
            )

        elif tool_name == "create_reschedule_suggestion":
            try:
                suggestion_data = args
                suggestion_data["_validated_uuid"] = uuid.UUID(
                    args.get("target_class_session_id", "")
                )
                final_content = args.get(
                    "confirmation_message",
                    "Schedule change suggestion has been submitted.",
                )
            except (ValueError, TypeError, AttributeError):
                final_content = (
                    "Sorry, but I cannot process your rescheduling request because "
                    "the target class session ID is missing or invalid. Please check "
                    "the prompt and try again."
                )
                suggestion_data = None
            break
    return final_content, suggestion_data


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
    user_msg_schema, schedule_user_id = await asyncio.to_thread(
        _save_user_msg_sync, chat_id, current_user.id, payload
    )
    user_context = await get_user_schedule_context(schedule_user_id, neo4j_session)

    messages = [
        {"role": "system", "content": get_system_prompt(user_context)},
        {"role": "user", "content": payload.content},
    ]

    final_content, suggestion_data = await _process_llm_tool_chain(
        messages, neo4j_session
    )
    ai_msg_schema = await asyncio.to_thread(
        _save_ai_msg_sync, chat_id, final_content, suggestion_data, user_context
    )

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
