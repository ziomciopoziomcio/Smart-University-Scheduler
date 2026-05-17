export interface Permission {
    id: number;
    code: string;
    name: string | null;
    description: string | null;
    group: string | null;
}

export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    degree: string | null;
    phone_number: string | null;
    created_at: string;
    roles?: string[];
    permissions?: Permission[];
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
    users_count?: number;
}

export interface UserRegistrationData {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    phone_number: string;
    degree: string;
}

export interface PasswordResetPayload {
    token: string;
    password: string;
    password2: string;
}

export interface TwoFactorSetupResponse {
    provisioning_uri: string;
    secret: string;
}

export interface BackupCodesResponse {
    backup_codes: string[];
}