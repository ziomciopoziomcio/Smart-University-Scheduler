import {getHeaders, USERS_URL, type PaginatedResponse} from "@api/core";
import type {User, UserFilters} from "./types";

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