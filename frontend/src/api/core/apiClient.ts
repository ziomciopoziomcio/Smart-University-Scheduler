import {useAuthStore} from '@store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3000';

export const ACADEMICS_URL = (BASE_URL ?
        `${BASE_URL}/academics` :
        'http://localhost:3000/academics'
).replace(/\/+$/, '');

export const FACILITIES_URL = (BASE_URL ?
    `${BASE_URL}/facilities` :
    'http://localhost:3000/facilities'
).replace(/\/+$/, '');

export const USERS_URL = (BASE_URL ?? (BASE_URL ?
    `${BASE_URL}/users` :
    'http://localhost:3000/users'
)).replace(/\/+$/, '');

export const COURSES_URL = (BASE_URL ?
    `${BASE_URL}/course` :
    'http://localhost:3000/course'
).replace(/\/+$/, '');


export const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

