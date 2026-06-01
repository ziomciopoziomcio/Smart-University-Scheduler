import {useAuthStore} from '@store/useAuthStore';

export const BASE_URL = (import.meta.env.VITE_API_URL as string || 'http://localhost:3000').replace(/\/+$/, '');

export const USERS_URL = `${BASE_URL}/users`;
export const ACADEMICS_URL = `${BASE_URL}/academics`;
export const FACILITIES_URL = `${BASE_URL}/facilities`;
export const COURSES_URL = `${BASE_URL}/course`;
export const SCHEDULES_URL = `${BASE_URL}/schedules`;


export const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

// Global fetch interceptor for 401 Unauthorized errors
if (typeof window !== 'undefined') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        if (response.status === 401) {
            const state = useAuthStore.getState();
            // Only trigger if we're currently authenticated (avoid triggering on login screen)
            if (state.token && !state.sessionExpired) {
                state.setSessionExpired(true);
            }
        }

        return response;
    };
}

/**
 * Enhanced fetch wrapper that handles 401 Unauthorized errors globally.
 */
export const apiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    });

    if (response.status === 401) {
        // Only trigger session expiration if we had a token to begin with
        // (to avoid triggering it on initial login failure)
        if (useAuthStore.getState().token) {
            useAuthStore.getState().setSessionExpired(true);
        }
    }

    return response;
};

