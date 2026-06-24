import {USERS_URL, getHeaders} from '@api/core/apiClient';

export interface APIKeyResponse {
    detail: string;
    api_key: string;
}

const extractErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
        return fallback;
    }

    try {
        const errorData = await response.json();
        const detail = errorData?.detail;
        
        if (Array.isArray(detail)) {
            return detail[0]?.msg || fallback;
        }
        
        return (typeof detail === 'string' && detail.length > 0) ? detail : fallback;
    } catch {
        return fallback;
    }
};

export interface APIKeyInfo {
    id: number;
    name: string;
    expiration_date: string;
    is_active: boolean;
}

export const generateApiKey = async (name?: string): Promise<APIKeyResponse> => {
    const response = await fetch(`${USERS_URL}/api-keys/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: name || undefined }),
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, 'Failed to generate API key');
        throw new Error(message);
    }

    return response.json() as Promise<APIKeyResponse>;
};

export const fetchApiKeys = async (): Promise<APIKeyInfo[]> => {
    const response = await fetch(`${USERS_URL}/api-keys`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, 'Failed to fetch API keys');
        throw new Error(message);
    }

    return response.json() as Promise<APIKeyInfo[]>;
};

export const revokeApiKey = async (keyId: number): Promise<void> => {
    const response = await fetch(`${USERS_URL}/api-keys/${keyId}/revoke`, {
        method: 'POST',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, 'Failed to revoke API key');
        throw new Error(message);
    }
};
