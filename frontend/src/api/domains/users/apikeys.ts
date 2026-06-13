import {USERS_URL, getHeaders} from "@api/core/apiClient";

export interface APIKeyResponse {
    detail: string;
    api_key: string;
}

export const generateApiKey = async (): Promise<APIKeyResponse> => {
    const response = await fetch(`${USERS_URL}/api-keys/generate`, {
        method: 'POST',
        headers: getHeaders(),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate API key');
    }
    
    return response.json();
};
