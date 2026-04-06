import type {AuthResponse} from './types';

const BASE_URL = 'http://localhost:3000/users';

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Could not login');
    }

    return response.json() as Promise<AuthResponse>;
};

export const registerUser = async (userData: any): Promise<void> => {
    const response = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: userData.email,
            password: userData.password,
            password2: userData.confirmPassword,
            name: userData.name,
            surname: userData.surname,
            phone_number: userData.phone_number,
            degree: userData.degree
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Array.isArray(errorData.detail)
            ? errorData.detail[0].msg
            : errorData.detail;
        throw new Error(errorMessage || 'Registration failed');
    }

    return;
};

export const verify2FA = async (code: string, preAuthToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/2fa/verify`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            code,
            pre_auth_token: preAuthToken
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '2FA failed');
    }

    return response.json() as Promise<AuthResponse>;
};

export const verifyEmail = async (token: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Activation failed');
    }

    return;
};

export const forgotPassword = async (email: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/password/forgot`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Forgot password request failed');
    }

    return;
};

export const resetPassword = async (payload: any): Promise<void> => {
    const response = await fetch(`${BASE_URL}/password/reset`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: payload.token,
            password: payload.password,
            password2: payload.password2,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Resetting password failed');
    }

    return;
};