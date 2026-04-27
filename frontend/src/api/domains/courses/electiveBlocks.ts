import {getHeaders, COURSES_URL, type PaginatedResponse} from "@api/core";
import type {ElectiveBlock, ElectiveBlockCreate, ElectiveBlockUpdate} from "./types";

export const fetchElectiveBlocks = async (
    limit = 100,
    offset = 0,
    filters: {
        study_field?: number;
        semester?: number;
        elective_block_name?: string;
    } = {}
): Promise<PaginatedResponse<ElectiveBlock>> => {
    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_field !== undefined && {study_field: filters.study_field.toString()}),
        ...(filters.semester !== undefined && {semester: filters.semester.toString()}),
        ...(filters.elective_block_name && {elective_block_name: filters.elective_block_name}),
    });

    const response = await fetch(`${COURSES_URL}/elective-blocks?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch elective blocks');
    }

    return response.json();
};

export const getElectiveBlock = async (id: number): Promise<ElectiveBlock> => {
    const response = await fetch(`${COURSES_URL}/elective-blocks/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów bloku');
    return response.json();
};

export const createElectiveBlock = async (payload: ElectiveBlockCreate): Promise<ElectiveBlock> => {
    const response = await fetch(`${COURSES_URL}/elective-blocks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się utworzyć bloku obieralnego');
    return response.json();
};

export const updateElectiveBlock = async (id: number, payload: ElectiveBlockUpdate): Promise<ElectiveBlock> => {
    const response = await fetch(`${COURSES_URL}/elective-blocks/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się zaktualizować bloku obieralnego');
    return response.json();
};

export const deleteElectiveBlock = async (id: number): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/elective-blocks/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się usunąć bloku obieralnego');
};