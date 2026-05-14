import {getHeaders, SCHEDULES_URL, type PaginatedResponse} from '@api/core';

import type {
    ResolveScheduleSuggestionRequest,
    ScheduleSuggestion,
    ScheduleSuggestionApiDto,
    ScheduleSuggestionsApiQuery,
    ScheduleSuggestionsQuery,
} from './types';

const SUGGESTIONS_URL = `${SCHEDULES_URL}/suggestions`;

function mapSuggestion(dto: ScheduleSuggestionApiDto): ScheduleSuggestion {
    return {
        id: dto.id,
        source: dto.source,
        reason: dto.reason,
        targetClassSessionId: dto.target_class_session_id,
        stateBefore: dto.state_before ?? {},
        stateAfter: dto.state_after ?? {},
        status: dto.status,
        createdAt: dto.created_at,
        resolvedAt: dto.resolved_at,
    };
}

function mapQuery(query: ScheduleSuggestionsQuery = {}): ScheduleSuggestionsApiQuery {
    return {
        status: query.status,
        source: query.source,
        target_class_session_id: query.targetClassSessionId,
        limit: query.limit,
        offset: query.offset,
    };
}

function buildUrl(baseUrl: string, query: ScheduleSuggestionsApiQuery = {}) {
    const url = new URL(baseUrl);

    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);

        const message =
            errorBody?.detail ??
            errorBody?.message ??
            `Request failed with status ${response.status}`;

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export async function getScheduleSuggestions(
    query: ScheduleSuggestionsQuery = {},
): Promise<PaginatedResponse<ScheduleSuggestion>> {
    const response = await fetch(buildUrl(SUGGESTIONS_URL, mapQuery(query)), {
        method: 'GET',
        headers: getHeaders(),
    });

    const data = await parseResponse<PaginatedResponse<ScheduleSuggestionApiDto>>(response);

    return {
        ...data,
        items: data.items.map(mapSuggestion),
    };
}

export async function getScheduleSuggestion(
    suggestionId: number,
): Promise<ScheduleSuggestion> {
    const response = await fetch(`${SUGGESTIONS_URL}/${suggestionId}`, {
        method: 'GET',
        headers: getHeaders(),
    });

    const data = await parseResponse<ScheduleSuggestionApiDto>(response);

    return mapSuggestion(data);
}

export async function resolveScheduleSuggestion(
    suggestionId: number,
    payload: ResolveScheduleSuggestionRequest,
): Promise<ScheduleSuggestion> {
    const response = await fetch(`${SUGGESTIONS_URL}/${suggestionId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    const data = await parseResponse<ScheduleSuggestionApiDto>(response);

    return mapSuggestion(data);
}

export async function deleteScheduleSuggestion(
    suggestionId: number,
): Promise<void> {
    const response = await fetch(`${SUGGESTIONS_URL}/${suggestionId}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);

        throw new Error(
            errorBody?.detail ??
            errorBody?.message ??
            `Request failed with status ${response.status}`,
        );
    }
}