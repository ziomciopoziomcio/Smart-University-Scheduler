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

export interface Campus {
    id: number;
    campus_name: string;
    campus_short: string;
}

export interface Building {
    id: number;
    building_name: string | null;
    building_number: string;
    campus_id: number;
}

export interface Room {
    id: number;
    room_name: string;
    building_id: number;
    faculty_id: number;
    pc_amount: number;
    room_capacity: number;
    unit_id: number | null;
    projector_availability: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}