import {getHeaders, type PaginatedResponse, ACADEMICS_URL} from '@api/core';
import {type Student} from './types.ts';


export const fetchStudents = async (
    limit = 100,
    offset = 0,
    search?: string
): Promise<PaginatedResponse<Student>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
    if (search) params.append('search', search);

    const response = await fetch(`${ACADEMICS_URL}/students?${params.toString()}`, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać listy studentów');
    }

    return response.json();
};

export const getStudent = async (id: number): Promise<Student> => {
    const response = await fetch(`${ACADEMICS_URL}/students/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów studenta');
    return response.json();
};

export const createStudent = async (data: {
    user_id: number;
    study_program: number;
    major?: number | null
}): Promise<Student> => {
    const response = await fetch(`${ACADEMICS_URL}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się przypisać profilu studenta');
    return response.json();
};

export const updateStudent = async (id: number, data: {
    study_program?: number;
    major?: number | null
}): Promise<Student> => {
    const response = await fetch(`${ACADEMICS_URL}/students/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować profilu studenta');
    return response.json();
};

export const deleteStudent = async (id: number): Promise<void> => {
    const response = await fetch(`${ACADEMICS_URL}/students/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć profilu studenta');
};