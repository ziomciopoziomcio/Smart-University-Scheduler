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


def process_chat_message(user_message: str) -> dict:
    """
    Process a chat message
    :param user_message: The message from the user
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

    system_prompt = (
        "You are an intelligent university schedule assistant. "
        "Your primary task is to help students and instructors manage their academic schedules. "
        "If the user asks to move, reschedule, or cancel a class, ALWAYS use the 'create_reschedule_suggestion' tool. "
        "Do not hallucinate class IDs or timeslots. If the user didn't provide enough context, ask them for details first. "
        "IMPORTANT: You must always mirror the user's language. If the user writes in English, reply in English. If they write in Polish, reply in Polish. If Spanish, reply in Spanish, etc."
    )
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
        arguments = json.loads(tool_calls.function.arguments)
        generated_reply = arguments.get(
            "confirmation_message", "Your request has been forwarded for approval."
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
