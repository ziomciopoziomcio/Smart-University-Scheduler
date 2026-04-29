import {COURSES_URL, type PaginatedResponse, getHeaders} from '@api/core';
import type {Major, MajorCreate, MajorUpdate} from './types';

export const fetchMajors = async (
    page = 1,
    limit = 10,
    search?: string,
    filters: {
        study_field?: number;
        major_name?: string;
        semester?: number;
    } = {},
): Promise<PaginatedResponse<Major>> => {
    const offset = (page - 1) * limit;
    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_field !== undefined && {study_field: filters.study_field.toString()}),
        ...(filters.major_name && {major_name: filters.major_name}),
        ...(filters.semester !== undefined && {semester: filters.semester.toString()}),
    });

    if (search) query.append('search', search);

    const response = await fetch(`${COURSES_URL}/majors?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch majors');
    return response.json();
};

export const getMajor = async (id: number): Promise<Major> => {
    const response = await fetch(`${COURSES_URL}/majors/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów specjalności');
    return response.json();
};

export const createMajor = async (payload: MajorCreate): Promise<Major> => {
    const response = await fetch(`${COURSES_URL}/majors`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się utworzyć specjalności');
    return response.json();
};

export const updateMajor = async (id: number, payload: MajorUpdate): Promise<Major> => {
    const response = await fetch(`${COURSES_URL}/majors/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się zaktualizować specjalności');
    return response.json();
};

export const deleteMajor = async (id: number): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/majors/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się usunąć specjalności');
};