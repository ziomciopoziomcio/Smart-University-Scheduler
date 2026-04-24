import {getHeaders, type PaginatedResponse, USERS_URL} from '@api/core';
import {type Permission, type Role} from './types.ts';

export const fetchPermissions = async (): Promise<PaginatedResponse<Permission>> => {
    const response = await fetch(`${USERS_URL}/permissions?limit=200`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać uprawnień');
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