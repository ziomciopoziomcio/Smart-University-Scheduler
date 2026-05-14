export type ChatRole = 'system' | 'user' | 'assistant';

export interface Chat {
    id: number;
    user_id: number;
    title: string | null;
    created_at: string;
}

export interface ChatMessage {
    id: number;
    chat_id: number;
    role: ChatRole;
    content: string;
    created_at: string;
}

export interface ChatTurnResponse {
    user_message: ChatMessage;
    ai_message: ChatMessage;
}

export interface CreateChatPayload {
    title?: string | null;
}

export interface UpdateChatPayload {
    title?: string | null;
}

export interface CreateMessagePayload {
    role?: ChatRole;
    content: string;
}