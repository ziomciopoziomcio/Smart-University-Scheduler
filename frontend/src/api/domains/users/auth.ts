import {USERS_URL} from '@api/core';
import type {User, AuthResponse} from './types';

const extractErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        try {
            const errorData = await response.json();
            const detail = errorData?.detail;
            if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
            if (typeof detail === 'string' && detail.length > 0) return detail;
        } catch {
            return fallback;
        }
    }

    try {
        const text = (await response.text()).trim();
        return text || fallback;
    } catch {
        return fallback;
    }
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await fetch(`${USERS_URL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: formData,
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, 'Could not login');
        throw new Error(message);
    }

    return response.json() as Promise<AuthResponse>;
};

export const registerUser = async (userData: any): Promise<void> => {
    const response = await fetch(`${USERS_URL}/signup`, {
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
        const message = await extractErrorMessage(response, 'Registration failed');
        throw new Error(message);
    }

    return;
};

export const verify2FA = async (code: string, preAuthToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${USERS_URL}/2fa/verify`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            code,
            pre_auth_token: preAuthToken
        }),
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, '2FA failed');
        throw new Error(message);
    }

    return response.json() as Promise<AuthResponse>;
};

export const verifyEmail = async (token: string): Promise<void> => {
    const response = await fetch(`${USERS_URL}/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, 'Activation failed');
        throw new Error(message);
    }

    return;
};

export const forgotPassword = async (email: string): Promise<void> => {
    const response = await fetch(`${USERS_URL}/password/forgot`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email}),
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, 'Forgot password request failed');
        throw new Error(message);
    }

    return;
};

export const resetPassword = async (payload: any): Promise<void> => {
    const response = await fetch(`${USERS_URL}/password/reset`, {
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
        const message = await extractErrorMessage(response, 'Resetting password failed');
        throw new Error(message);
    }

    return;
};


export const fetchUserData = async (token: string): Promise<User> => {
    const response = await fetch(`${USERS_URL}/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }

    return response.json();
};