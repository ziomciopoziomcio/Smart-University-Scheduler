import {useAuthStore} from '@store/useAuthStore';
import type {User, PaginatedResponse, Role, Permission} from './types';

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const USERS_URL = (baseApiUrl ? `${baseApiUrl}/users` : 'http://localhost:3000/users').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

export const createUser = async (data: Record<string, unknown>): Promise<User> => {
    const response = await fetch(USERS_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć użytkownika');
    return response.json();
};

export const updateUser = async (id: number, data: Record<string, unknown>): Promise<User> => {
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
    roles?: string[];
    exclude_roles?: string[];
    has_roles?: boolean;
    profiles?: ('student' | 'employee')[];
    exclude_profiles?: ('student' | 'employee')[];
    has_profiles?: boolean;
}

const buildUserParams = (limit: number, offset: number, search?: string, filters?: UserFilters) => {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
    });

    if (search) params.append('search', search);

    if (filters) {
        if (filters.roles?.length) params.append('roles', filters.roles.join(','));
        if (filters.exclude_roles?.length) params.append('exclude_roles', filters.exclude_roles.join(','));
        if (filters.has_roles !== undefined) params.append('has_roles', filters.has_roles.toString());
        if (filters.profiles?.length) params.append('profiles', filters.profiles.join(','));
        if (filters.exclude_profiles?.length) params.append('exclude_profiles', filters.exclude_profiles.join(','));
        if (filters.has_profiles !== undefined) params.append('has_profiles', filters.has_profiles.toString());
    }
    return params;
};

export const fetchUsers = async (
    limit = 100,
    offset = 0,
    search?: string,
    filters?: UserFilters
): Promise<PaginatedResponse<User>> => {
    const params = buildUserParams(limit, offset, search, filters);
    const response = await fetch(`${USERS_URL}?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać listy użytkowników');
    return response.json();
};

export const fetchPermissions = async (): Promise<PaginatedResponse<Permission>> => {
    const response = await fetch(`${USERS_URL}/permissions?limit=200`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać uprawnień');
    return response.json();
};

export const getRole = async (id: number): Promise<Role> => {
    const response = await fetch(`${USERS_URL}/roles/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać roli');
    return response.json();
};

export const updateRolePermissions = async (roleId: number, permissionIds: number[]): Promise<Role> => {
    const response = await fetch(`${USERS_URL}/roles/${roleId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({permissions: permissionIds}),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować uprawnień roli');
    return response.json();
};

export const createRole = async (data: { role_name: string; permissions?: number[] }): Promise<Role> => {
    const response = await fetch(`${USERS_URL}/roles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć roli');
    return response.json();
};

export const updateRole = async (id: number, data: { role_name?: string }): Promise<Role> => {
    const response = await fetch(`${USERS_URL}/roles/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować roli');
    return response.json();
};

export const deleteRole = async (id: number): Promise<void> => {
    const response = await fetch(`${USERS_URL}/roles/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć roli');
};