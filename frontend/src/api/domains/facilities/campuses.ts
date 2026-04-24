import {FACILITIES_URL, getHeaders, type PaginatedResponse} from '@api/core';
import type {Campus} from './types';

export const fetchCampuses = async (): Promise<PaginatedResponse<Campus>> => {
    const response = await fetch(`${FACILITIES_URL}/campuses`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kampusów');
    return response.json();
};
export const createCampus = async (data: { campus_short: string; campus_name?: string }): Promise<Campus> => {
    const response = await fetch(`${FACILITIES_URL}/campuses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create campus');
    }

    return response.json();
};

export const updateCampus = async (id: number, data: {
    campus_short?: string;
    campus_name?: string
}): Promise<Campus> => {
    const response = await fetch(`${FACILITIES_URL}/campuses/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować kampusu');
    return response.json();
};

export const deleteCampus = async (id: number): Promise<void> => {
    const response = await fetch(`${FACILITIES_URL}/campuses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć kampusu');
};


export const getCampus = async (id: number): Promise<Campus> => {
    const response = await fetch(`${FACILITIES_URL}/campuses/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kampusu');
    return response.json();
};