import {getHeaders, FACILITIES_URL, type PaginatedResponse} from "@api/core";
import type {Building} from "./types";

export const fetchBuildings = async (
    campusId: number,
    limit = 20,
    offset = 0
): Promise<PaginatedResponse<Building>> => {
    const response = await fetch(
        `${FACILITIES_URL}/buildings?campus_id=${campusId}&limit=${limit}&offset=${offset}`,
        {headers: getHeaders()}
    );
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