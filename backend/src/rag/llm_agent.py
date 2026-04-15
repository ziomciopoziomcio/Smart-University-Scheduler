import json
from groq import Groq
from groq.types.chat import (
    ChatCompletionMessageParam,
    ChatCompletionToolParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
)

from .tools import RescheduleSuggestionTool

client = Groq()


def process_chat_message(user_message: str, schedule_context: str) -> dict:
    """
    Process a chat message
    :param user_message: The message from the user
    :param schedule_context: The context of the schedule
    :return: A dictionary containing the response from the LLM, including any tool suggestions
    """
    tools: list[ChatCompletionToolParam] = [
        {
            "type": "function",
            "function": {
                "name": "create_reschedule_suggestion",
                "description": "Use this tool ONLY when the user explicitly asks to move, reschedule, or cancel a specific class session.",
                "parameters": RescheduleSuggestionTool.model_json_schema(),
            },
        }
    ]

    system_prompt = f"""
    You are an intelligent university schedule assistant.

    HERE IS THE USER'S CURRENT SCHEDULE (CONTEXT):
    {schedule_context}

    Your task is to help the user manage this schedule.
    If they want to move or cancel a class, use the 'create_reschedule_suggestion' tool.
    ALWAYS use the Class Session IDs provided in the context above.
    """

    messages: list[ChatCompletionMessageParam] = [
        ChatCompletionSystemMessageParam(role="system", content=system_prompt),
        ChatCompletionUserMessageParam(role="user", content=user_message),
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.0,
    )

    response_message = response.choices[0].message
    if response_message.tool_calls:
        tool_calls = response_message.tool_calls[0]
        try:
            arguments = json.loads(tool_calls.function.arguments)
        except (json.JSONDecodeError, TypeError, AttributeError):
            arguments = None

        if isinstance(arguments, dict):
            generated_reply = arguments.get(
                "confirmation_message",
                "Your request has been forwarded for approval.",
            )
            return {
                "type": "tool_call",
                "content": generated_reply,
                "suggestion_data": arguments,
            }
    return {
        "type": "text",
        "content": response_message.content,
        "suggestion_data": None,
    }
