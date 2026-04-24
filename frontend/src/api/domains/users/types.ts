export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    degree: string | null;
    phone_number: string | null;
    created_at: string;
    roles?: string[];
    two_factor_enabled?: boolean;
}

export interface UserFilters {
    roles?: string[];
    exclude_roles?: string[];
    has_roles?: boolean;
    profiles?: ('student' | 'employee')[];
    exclude_profiles?: ('student' | 'employee')[];
    has_profiles?: boolean;
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

export interface Permission {
    id: number;
    code: string;
    name: string | null;
    description: string | null;
    group: string | null;
}

export interface Role {
    id: number;
    role_name: string;
    permissions: Permission[];
}