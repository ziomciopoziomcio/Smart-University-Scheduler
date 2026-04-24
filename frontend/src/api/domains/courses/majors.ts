import {COURSES_URL, type PaginatedResponse, getHeaders} from '@api/core';
import type {Major, MajorCreate, MajorUpdate} from './types';

export const fetchMajors = async (
    limit = 100,
    offset = 0,
    filters: {
        study_field?: number;
        major_name?: string;
    } = {}
): Promise<PaginatedResponse<Major>> => {
    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_field !== undefined && {study_field_id: filters.study_field.toString()}),
        ...(filters.major_name && {major_name: filters.major_name}),
    });

    const response = await fetch(`${COURSES_URL}/majors?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać listy specjalności');
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