from groq import Groq
from groq.types.chat import (
    ChatCompletionMessageParam,
    ChatCompletionToolParam,
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
    """


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
