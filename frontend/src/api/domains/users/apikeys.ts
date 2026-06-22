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

export const generateApiKey = async (): Promise<APIKeyResponse> => {
    const response = await fetch(`${USERS_URL}/api-keys/generate`, {
        method: 'POST',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response, 'Failed to generate API key');
        throw new Error(message);
    }

    return response.json() as Promise<APIKeyResponse>;
};
