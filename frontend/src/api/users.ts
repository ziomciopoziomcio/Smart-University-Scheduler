import {useAuthStore} from '@store/useAuthStore';
import type {User, PaginatedResponse, Role} from './types';

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const USERS_URL = (baseApiUrl ? `${baseApiUrl}/users` : 'http://localhost:3000/users').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

export const fetchUsers = async (
    limit: number = 100,
    offset: number = 0,
    filters?: { has_role?: boolean; exclude_students?: boolean; exclude_employees?: boolean }
): Promise<PaginatedResponse<User>> => {

    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
    });

    if (filters?.has_role !== undefined) params.append('has_role', filters.has_role.toString());
    if (filters?.exclude_students) params.append('exclude_students', 'true');
    if (filters?.exclude_employees) params.append('exclude_employees', 'true');

    const response = await fetch(`${USERS_URL}?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać listy użytkowników');
    return response.json();
};

export const createUser = async (data: any): Promise<User> => {
    const response = await fetch(`${USERS_URL}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć użytkownika');
    return response.json();
};

export const updateUser = async (id: number, data: any): Promise<User> => {
    const response = await fetch(`${USERS_URL}/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować użytkownika');
    return response.json();
};

export const deleteUser = async (id: number): Promise<void> => {
    const response = await fetch(`${USERS_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć użytkownika');
};

export const fetchRoles = async (): Promise<PaginatedResponse<Role>> => {
    const response = await fetch(`${USERS_URL}/roles`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać listy ról');
    return response.json();
};

export interface UserFilters {
    has_roles?: boolean;
    roles?: string[];
    exclude_profiles?: ('student' | 'employee')[];
}
