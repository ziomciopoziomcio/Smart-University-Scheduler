import json

from groq import Groq
from groq.types.chat import (
    ChatCompletionMessageParam,
    ChatCompletionToolParam,
    ChatCompletionSystemMessageParam,
)

from .tools import RescheduleSuggestionTool, CheckAvailabilityTool

client = Groq()


def get_system_prompt(schedule_context: str) -> str:
    """
    Generate the system prompt containing the user's schedule context and agent rules.

    :param schedule_context: The text representation of the user's schedule.
    :return: The formatted system prompt string.
    """
    return f"""
    You are an intelligent university schedule assistant.

    HERE IS THE USER'S CURRENT SCHEDULE (CONTEXT):
    {schedule_context}

    RULES:
    1. If the user wants to reschedule or move a class, you MUST ALWAYS call 'check_availability' first to check for conflicts and find available rooms.
    2. If 'check_availability' returns a CONFLICT or NO ROOMS, inform the user and ask them to select a different time. DO NOT call 'create_reschedule_suggestion'.
    3. If 'check_availability' returns OK, use one of the available Room IDs provided in the tool response and then call 'create_reschedule_suggestion'.
    4. ALWAYS use the Class Session IDs provided in the context above.
    """  # TODO: Block another topics


def call_agent(messages: list[ChatCompletionMessageParam]):
    """
    Call the LLM with a sequence of messages and available tools.

    :param messages: The message history including system, user, assistant, and tool messages.
    :return: The response message object from the LLM, containing either text content or tool calls.
    """
    tools: list[ChatCompletionToolParam] = [
        {
            "type": "function",
            "function": {
                "name": "check_availability",
                "description": "Check if a proposed timeslot has any group or instructor conflicts, and find available rooms. Always use this before suggesting a reschedule.",
                "parameters": CheckAvailabilityTool.model_json_schema(),
            },
        },
        {
            "type": "function",
            "function": {
                "name": "create_reschedule_suggestion",
                "description": "Submit a formal request to reschedule a class session. Call this ONLY after verifying availability with check_availability.",
                "parameters": RescheduleSuggestionTool.model_json_schema(),
            },
        },
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.0,
    )

    return response.choices[0].message


def process_chat_message(user_message: str, schedule_context: str) -> dict:
    """
    Process a user message by calling the LLM agent with the appropriate system prompt and message history.
    :param user_message: The content of the user's message to the agent.
    :param schedule_context: The text representation of the user's current schedule, to be included in the system prompt for context.
    :return: A dictionary containing the agent's response, which may include either a text reply or a tool call with parameters.
    """
    messages: list[ChatCompletionMessageParam] = [
        ChatCompletionSystemMessageParam(
            role="system", content=get_system_prompt(schedule_context)
        ),
        ChatCompletionMessageParam(role="user", content=user_message),
    ]
    response_message = call_agent(messages)

    if response_message.tool_calls:
        tool_call = response_message.tool_calls[0]
        try:
            arguments = json.loads(tool_call.function.arguments)
        except (json.JSONDecodeError, TypeError, AttributeError):
            arguments = None

        if isinstance(arguments, dict):
            generated_reply = arguments.get(
                "confirmation_message",
                "Your request has been forwarded for processing.",
            )
            return {
                "type": "tool_call",
                "tool_name": tool_call.function.name,
                "content": generated_reply,
                "suggestion_data": arguments,
            }
    return {
        "type": "text",
        "content": response_message.content,
        "suggestion_data": None,
    }
