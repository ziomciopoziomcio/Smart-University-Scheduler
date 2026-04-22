import type {Role} from "./types";
import {getHeaders, USERS_URL, type PaginatedResponse} from "@api/core";

export const fetchRoles = async (): Promise<PaginatedResponse<Role>> => {
    const response = await fetch(`${USERS_URL}/roles`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać listy ról');
    return response.json();
};

export const getRole = async (id: number): Promise<Role> => {
    const response = await fetch(`${USERS_URL}/roles/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać roli');
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