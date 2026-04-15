import {useAuthStore} from '@store/useAuthStore';
import type {PaginatedResponse, Campus, Building, Room} from './types';

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const BASE_URL = (baseApiUrl ? `${baseApiUrl}/facilities` : 'http://localhost:3000/facilities').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

export const fetchCampuses = async (): Promise<PaginatedResponse<Campus>> => {
    const response = await fetch(`${BASE_URL}/campuses`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kampusów');
    return response.json();
};

export const fetchBuildings = async (campusId: number): Promise<PaginatedResponse<Building>> => {
    const response = await fetch(`${BASE_URL}/buildings?campus_id=${campusId}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać budynków');
    return response.json();
};

export const fetchRooms = async (buildingId: number): Promise<PaginatedResponse<Room>> => {
    const response = await fetch(`${BASE_URL}/rooms?building_id=${buildingId}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać sal');
    return response.json();
};

export const createCampus = async (data: { campus_short: string; campus_name?: string }): Promise<Campus> => {
    const response = await fetch(`${BASE_URL}/campuses`, {
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
    const response = await fetch(`${BASE_URL}/campuses/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować kampusu');
    return response.json();
};

export const deleteCampus = async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/campuses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć kampusu');
};