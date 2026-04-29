import {type PaginatedResponse, FACILITIES_URL, getHeaders} from "@api/core";
import type {Room} from "./types";

export const fetchRooms = async (
    buildingId: number,
    page = 1,
    limit = 10,
    search?: string,
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

    if (search) query.append('search', search);

    const response = await fetch(`${FACILITIES_URL}/rooms?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
};


export const getRoom = async (id: number): Promise<Room> => {
    const response = await fetch(`${FACILITIES_URL}/rooms/${id}`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        throw new Error('failed to fetch room');
    }
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
    const response = await fetch(`${FACILITIES_URL}/rooms`, {
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
    const response = await fetch(`${FACILITIES_URL}/rooms/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować sali');
    return response.json();
};

export const deleteRoom = async (id: number): Promise<void> => {
    const response = await fetch(`${FACILITIES_URL}/rooms/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć sali');
};