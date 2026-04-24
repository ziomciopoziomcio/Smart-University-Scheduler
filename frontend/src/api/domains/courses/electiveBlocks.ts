import {getHeaders, COURSES_URL, type PaginatedResponse} from "@api/core";
import {type ElectiveBlock} from "./types";


export const fetchElectiveBlocks = async (
    page = 1,
    limit = 100,
    filters: {
        study_field?: number;
        elective_block_name?: string;
    } = {}
): Promise<PaginatedResponse<ElectiveBlock>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_field !== undefined && {study_field: filters.study_field.toString()}),
        ...(filters.elective_block_name && {elective_block_name: filters.elective_block_name}),
    });

    const response = await fetch(`${COURSES_URL}/elective-blocks?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch elective blocks');
    return response.json();
};