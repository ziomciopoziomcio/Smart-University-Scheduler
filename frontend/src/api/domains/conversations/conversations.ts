import {BASE_URL, getHeaders, type PaginatedResponse} from '@api/core';
import type {Chat, CreateChatPayload, UpdateChatPayload, CreateMessagePayload, ChatMessage, ChatTurnResponse} from "./types";

const CHATS_URL = `${BASE_URL}/chats`;

export const fetchChats = async (
    page = 1,
    limit = 50
): Promise<PaginatedResponse<Chat>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    const response = await fetch(`${CHATS_URL}/?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać historii rozmów');
    }

    return response.json();
};

export const createChat = async (
    title?: string | null
): Promise<Chat> => {
    const response = await fetch(`${CHATS_URL}/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            title: title ?? null,
        } satisfies CreateChatPayload),
    });

    if (!response.ok) {
        throw new Error('Nie udało się utworzyć rozmowy');
    }

    return response.json();
};

export const getChat = async (
    chatId: number
): Promise<Chat> => {
    const response = await fetch(`${CHATS_URL}/${chatId}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać rozmowy');
    }

    return response.json();
};

export const updateChat = async (
    chatId: number,
    payload: UpdateChatPayload
): Promise<Chat> => {
    const response = await fetch(`${CHATS_URL}/${chatId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Nie udało się zaktualizować rozmowy');
    }

    return response.json();
};

export const deleteChat = async (
    chatId: number
): Promise<void> => {
    const response = await fetch(`${CHATS_URL}/${chatId}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Nie udało się usunąć rozmowy');
    }
};

export const fetchChatMessages = async (
    chatId: number,
    page = 1,
    limit = 100
): Promise<PaginatedResponse<ChatMessage>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    const response = await fetch(`${CHATS_URL}/${chatId}/messages?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać wiadomości');
    }

    return response.json();
};

export const sendChatMessage = async (
    chatId: number,
    content: string
): Promise<ChatTurnResponse> => {
    const response = await fetch(`${CHATS_URL}/${chatId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            role: 'user',
            content,
        } satisfies CreateMessagePayload),
    });

    if (!response.ok) {
        throw new Error('Nie udało się wysłać wiadomości');
    }

    return response.json();
};