import {getHeaders, type PaginatedResponse, ACADEMICS_URL} from '@api/core';
import {type Student} from './types.ts';

export const fetchStudents = async (
    page = 1,
    limit = 10,
    search?: string,
    filters: {
        study_program?: number;
        major?: number;
        group_id?: number;
        exclude_group_id?: number;
    } = {}
): Promise<PaginatedResponse<Student>> => {
    const offset = (page - 1) * limit;
    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_program !== undefined && {study_program: filters.study_program.toString()}),
        ...(filters.major !== undefined && {major: filters.major.toString()}),
        ...(filters.group_id !== undefined && {group_id: filters.group_id.toString()}),
        ...(filters.exclude_group_id !== undefined && {exclude_group_id: filters.exclude_group_id.toString()})
    });

    if (search) query.append('search', search);

    const response = await fetch(`${ACADEMICS_URL}/students?${query.toString()}`, {
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
    if (!response.ok) throw new Error('Nie udało się usunąć studenta');
};