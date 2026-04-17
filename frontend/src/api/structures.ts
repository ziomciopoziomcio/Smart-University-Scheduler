import {useAuthStore} from '@store/useAuthStore';
import {type PaginatedResponse} from './types';

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const FACILITIES_URL = (baseApiUrl ? `${baseApiUrl}/facilities` : 'http://localhost:3000/facilities').replace(/\/+$/, '');
const ACADEMICS_URL = (baseApiUrl ? `${baseApiUrl}/academics` : 'http://localhost:3000/academics').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});


export const fetchFaculties = async (): Promise<PaginatedResponse<unknown>> => {
    const res = await fetch(`${FACILITIES_URL}/faculties`, {headers: getHeaders()});
    if (!res.ok) throw new Error('Błąd pobierania wydziałów');
    return res.json();
};

export const getFaculty = async (id: number): Promise<unknown> => {
    const res = await fetch(`${FACILITIES_URL}/faculties/${id}`, {headers: getHeaders()});
    if (!res.ok) throw new Error('Błąd pobierania wydziału');
    return res.json();
};

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
        method: 'DELETE', // Zmiana z POST na DELETE
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Nie udało się usunąć wydziału');
};


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

export const deleteCampus = async (id: number): Promise<void> => {
    const res = await fetch(`${FACILITIES_URL}/campuses/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Nie udało się usunąć kampusu');
};