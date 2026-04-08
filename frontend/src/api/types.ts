export interface AuthResponse {
    access_token: string;
    token_type: string;
    requires_2fa: boolean;
}

export interface LoginError {
    detail: string;
}