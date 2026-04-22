import {useAuthStore} from '@store/useAuthStore';
import type {PaginatedResponse, Campus, Building, Room, Faculty} from './types';

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const BASE_URL = (baseApiUrl ? `${baseApiUrl}/facilities` : 'http://localhost:3000/facilities').replace(/\/+$/, '');
const ACADEMICS_URL = (baseApiUrl ? `${baseApiUrl}/academics` : 'http://localhost:3000/academics').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

export const fetchCampuses = async (): Promise<PaginatedResponse<Campus>> => {
    const response = await fetch(`${BASE_URL}/campuses`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kampusów');
    return response.json();
};

export const fetchBuildings = async (
    campusId: number,
    limit: number = 20,
    offset: number = 0
): Promise<PaginatedResponse<Building>> => {
    const response = await fetch(
        `${BASE_URL}/buildings?campus_id=${campusId}&limit=${limit}&offset=${offset}`,
        {headers: getHeaders()}
    );
    if (!response.ok) throw new Error('Failed to fetch buildings');
    return response.json();
};

export const fetchRooms = async (
    buildingId: number,
    page: number = 1,
    limit: number = 10,
    filters: {
        room_name?: string;
        projector_availability?: boolean;
        min_capacity?: number;
    } = {}
): Promise<PaginatedResponse<Room>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        building_id: buildingId.toString(),
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.room_name && {room_name: filters.room_name}),
        ...(filters.projector_availability !== undefined && {projector_availability: String(filters.projector_availability)}),
        ...(filters.min_capacity && {min_room_capacity: filters.min_capacity.toString()}),
    });

    const response = await fetch(`${BASE_URL}/rooms?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch rooms');
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

export const getCampus = async (id: number): Promise<Campus> => {
    const response = await fetch(`${BASE_URL}/campuses/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kampusu');
    return response.json();
};

export const getBuilding = async (id: number): Promise<Building> => {
    const response = await fetch(`${BASE_URL}/buildings/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać budynku');
    return response.json();
};

export const createBuilding = async (data: {
    building_number: string;
    building_name?: string;
    campus_id: number
}): Promise<Building> => {
    const response = await fetch(`${BASE_URL}/buildings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć budynku');
    return response.json();
};

export const getRoom = async (id: number): Promise<Room> => {
    const response = await fetch(`${BASE_URL}/rooms/${id}`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        throw new Error('failed to fetch room');
    }
    return response.json();
};

export const updateBuilding = async (id: number, data: {
    building_number?: string;
    building_name?: string;
    campus_id?: number
}): Promise<Building> => {
    const response = await fetch(`${BASE_URL}/buildings/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować budynku');
    return response.json();
};

export const deleteBuilding = async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/buildings/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć budynku');
};

export const fetchFaculties = async (
    page: number = 1,
    limit: number = 10,
    filters: {
        faculty_name?: string;
        faculty_short?: string;
    } = {}
): Promise<PaginatedResponse<Faculty>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.faculty_name?.trim() && {faculty_name: filters.faculty_name.trim()}),
        ...(filters.faculty_short?.trim() && {faculty_short: filters.faculty_short.trim()}),
    });

    const response = await fetch(`${BASE_URL}/faculties?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać wydziałów');
    return response.json();
};

export const createRoom = async (data: {
    room_name: string;
    building_id: number;
    faculty_id: number | null;
    unit_id?: number | null;
    pc_amount: number;
    room_capacity: number;
    projector_availability: boolean;
}): Promise<Room> => {
    const response = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć sali');
    return response.json();
};

export const updateRoom = async (id: number, data: {
    room_name?: string;
    room_capacity?: number;
    pc_amount?: number;
    building_id?: number;
    faculty_id: number;
    unit_id?: number | null;
    projector_availability?: boolean;
}): Promise<Room> => {
    const response = await fetch(`${BASE_URL}/rooms/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować sali');
    return response.json();
};

export const deleteRoom = async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/rooms/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć sali');
};

export const fetchUnits = async (): Promise<PaginatedResponse<any>> => {
    const response = await fetch(`${ACADEMICS_URL}/units`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać jednostek');
    return response.json();
};