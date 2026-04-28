import {getHeaders, ACADEMICS_URL, type PaginatedResponse} from '@api/core';
import type {Unit} from "./types.ts";

export const fetchUnits = async (
    facultyId: number,
    page = 1,
    limit = 10,
    search?: string
): Promise<PaginatedResponse<Unit>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        faculty_id: facultyId.toString(),
        limit: limit.toString(),
        offset: offset.toString()
    });

    if (search) query.append('search', search);

    const res = await fetch(`${ACADEMICS_URL}/units?${query.toString()}`, {headers: getHeaders()});
    if (!res.ok) throw new Error('Błąd pobierania jednostek');
    return res.json();
};

export const getUnit = async (id: number): Promise<Unit> => {
    const response = await fetch(`${ACADEMICS_URL}/units/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów jednostki');
    return response.json();
};

export const createUnit = async (data: { unit_name: string; unit_short: string; faculty_id: number }) => {
    const res = await fetch(`${ACADEMICS_URL}/units`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Błąd tworzenia');
    return res.json();
};

export const updateUnit = async (id: number, data: {
    unit_name?: string;
    unit_short?: string;
    faculty_id?: number
}) => {
    const res = await fetch(`${ACADEMICS_URL}/units/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Nie udało się zaktualizować jednostki');
    return res.json();
};

export const deleteUnit = async (id: number): Promise<void> => {
    const res = await fetch(`${ACADEMICS_URL}/units/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Nie udało się usunąć jednostki');
};