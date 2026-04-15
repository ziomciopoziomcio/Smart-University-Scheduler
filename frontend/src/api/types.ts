export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    degree: string | null;
    phone_number: string | null;
    created_at: string;
    roles?: string[];
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    requires_2fa: boolean;
    user?: User;
}

export interface LoginError {
    detail: string | { msg: string }[];
}

export type ScheduleTileVariant = 'lecture' | 'lab' | 'exercise' | 'project' | 'seminar';

export interface ScheduleEntry {
    id: string;
    title: string;
    date: string;
    startHour: number;
    endHour: number;
    variant: ScheduleTileVariant;
}

export interface WeekScheduleProps {
    entries: ScheduleEntry[];
}