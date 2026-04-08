export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    degree?: string;
    phone_number?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    requires_2fa: boolean;
    user?: User;
}

export interface LoginError {
    detail: string;
}