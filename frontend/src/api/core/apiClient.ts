import {useAuthStore} from '@store/useAuthStore';

export const BASE_URL = (import.meta.env.VITE_API_URL as string || 'http://localhost:8000').replace(/\/+$/, '');

export const USERS_URL = `${BASE_URL}/users`;
export const ACADEMICS_URL = `${BASE_URL}/academics`;
export const FACILITIES_URL = `${BASE_URL}/facilities`;
export const COURSES_URL = `${BASE_URL}/course`;


export const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

