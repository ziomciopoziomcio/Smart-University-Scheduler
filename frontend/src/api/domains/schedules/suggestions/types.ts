export type ScheduleSuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FAILED';

export type ScheduleSuggestionSource = string;

export type SuggestionStateValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | SuggestionState
    | SuggestionStateValue[];

export interface SuggestionState {
    [key: string]: SuggestionStateValue;
}

export interface ScheduleSuggestion {
    id: number;
    source: ScheduleSuggestionSource;
    reason: string;
    targetClassSessionId: string;
    stateBefore: SuggestionState;
    stateAfter: SuggestionState;
    status: ScheduleSuggestionStatus;
    createdAt: string;
    resolvedAt: string | null;
}

export interface ScheduleSuggestionApiDto {
    id: number;
    source: ScheduleSuggestionSource;
    reason: string;
    target_class_session_id: string;
    state_before: SuggestionState;
    state_after: SuggestionState;
    status: ScheduleSuggestionStatus;
    created_at: string;
    resolved_at: string | null;
}

export interface ScheduleSuggestionsQuery {
    status?: ScheduleSuggestionStatus;
    source?: string;
    targetClassSessionId?: string;
    limit?: number;
    offset?: number;
}

export interface ScheduleSuggestionsApiQuery {
    status?: ScheduleSuggestionStatus;
    source?: string;
    target_class_session_id?: string;
    limit?: number;
    offset?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

export interface PaginatedApiResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

export interface ResolveScheduleSuggestionRequest {
    status: Extract<ScheduleSuggestionStatus, 'ACCEPTED' | 'REJECTED' | 'FAILED'>;
}