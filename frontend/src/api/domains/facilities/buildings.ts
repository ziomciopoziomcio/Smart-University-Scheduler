import {getHeaders, FACILITIES_URL, type PaginatedResponse} from "@api/core";
import type {Building} from "./types";

export const fetchBuildings = async (
    campusId: number,
    page = 1,
    limit = 10,
    search?: string
): Promise<PaginatedResponse<Building>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        campus_id: campusId.toString(),
        limit: limit.toString(),
        offset: offset.toString()
    });

    if (search) query.append('search', search);

    const response = await fetch(`${FACILITIES_URL}/buildings?${query.toString()}`, {
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch buildings');
    return response.json();
};

export const getBuilding = async (id: number): Promise<Building> => {
    const response = await fetch(`${FACILITIES_URL}/buildings/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać budynku');
    return response.json();
};

export const createBuilding = async (data: {
    building_number: string;
    building_name?: string;
    campus_id: number
}): Promise<Building> => {
    const response = await fetch(`${FACILITIES_URL}/buildings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć budynku');
    return response.json();
};

export const updateBuilding = async (id: number, data: {
    building_number?: string;
    building_name?: string;
    campus_id?: number
}): Promise<Building> => {
    const response = await fetch(`${FACILITIES_URL}/buildings/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować budynku');
    return response.json();
};

export const deleteBuilding = async (id: number): Promise<void> => {
    const response = await fetch(`${FACILITIES_URL}/buildings/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć budynku');
};