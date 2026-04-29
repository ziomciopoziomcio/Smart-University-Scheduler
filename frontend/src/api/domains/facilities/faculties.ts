import {FACILITIES_URL, getHeaders, type PaginatedResponse} from "@api/core";
import {type Faculty} from "./types";

export const fetchFaculties = async (
    page = 1,
    limit = 10,
    search?: string
): Promise<PaginatedResponse<Faculty>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
    });

    if (search) query.append('search', search);

    const response = await fetch(`${FACILITIES_URL}/faculties?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać wydziałów');
    return response.json();
};

export const getFaculty = async (id: number): Promise<Faculty> => {
    const res = await fetch(`${FACILITIES_URL}/faculties/${id}`, {headers: getHeaders()});
    if (!res.ok) throw new Error('Błąd pobierania wydziału');
    return await res.json();
}

export const createFaculty = async (data: { faculty_name: string; faculty_short: string }) => {
    const res = await fetch(`${FACILITIES_URL}/faculties`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Błąd tworzenia');
    return res.json();
};

export const updateFaculty = async (id: number, data: { faculty_name?: string; faculty_short?: string }) => {
    const res = await fetch(`${FACILITIES_URL}/faculties/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Nie udało się zaktualizować wydziału');
    return res.json();
};

export const deleteFaculty = async (id: number): Promise<void> => {
    const res = await fetch(`${FACILITIES_URL}/faculties/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Nie udało się usunąć wydziału');
};