export const BASE_URL = (import.meta.env.VITE_API_URL as string || 'http://localhost:3000').replace(/\/+$/, '');

export const USERS_URL = `${BASE_URL}/users`;
export const ACADEMICS_URL = `${BASE_URL}/academics`;
export const FACILITIES_URL = `${BASE_URL}/facilities`;
export const COURSES_URL = `${BASE_URL}/course`;
export const SCHEDULES_URL = `${BASE_URL}/schedules`;

/**
 * Safely retrieves the token from localStorage without importing the store
 * to avoid circular dependencies.
 */
const getTokenFromStorage = (): string | null => {
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) return null;
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
    } catch (e) {
        return null;
    }
};

/**
 * Notifies the application about an unauthorized response via a custom event.
 * This allows the store to react without being directly imported here.
 */
const notifyUnauthorized = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:unauthorized'));
    }
};

export const getHeaders = () => {
    const token = getTokenFromStorage();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Global fetch interceptor for 401 Unauthorized errors
if (typeof window !== 'undefined') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        if (response.status === 401) {
            // Check if we actually had a token (to avoid triggering on login screen)
            if (getTokenFromStorage()) {
                notifyUnauthorized();
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
        if (getTokenFromStorage()) {
            notifyUnauthorized();
        }
    }

    return response;
};

