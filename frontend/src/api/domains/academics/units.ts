import {getHeaders, ACADEMICS_URL, type PaginatedResponse} from '@api/core';

export const fetchUnits = async (facultyId: number): Promise<PaginatedResponse<unknown>> => {
    const res = await fetch(`${ACADEMICS_URL}/units?faculty_id=${facultyId}`, {headers: getHeaders()});
    if (!res.ok) throw new Error('Błąd pobierania jednostek');
    return res.json();
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