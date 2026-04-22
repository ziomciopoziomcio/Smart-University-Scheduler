import {getHeaders, type PaginatedResponse, ACADEMICS_URL} from '@api/core';
import {type Group} from './types.ts';

export const fetchGroups = async (
    page: number = 1,
    limit: number = 100,
    filters: {
        study_program?: number;
        major?: number;
        elective_block?: number;
        group_name?: string;
    } = {},
): Promise<PaginatedResponse<Group>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_program !== undefined && {
            study_program: filters.study_program.toString(),
        }),
        ...(filters.major !== undefined && {
            major: filters.major.toString(),
        }),
        ...(filters.elective_block !== undefined && {
            elective_block: filters.elective_block.toString(),
        }),
        ...(filters.group_name && {
            group_name: filters.group_name,
        }),
    });

    const response = await fetch(`${ACADEMICS_URL}/groups?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch groups');
    return response.json();
};

export const getGroup = async (id: number): Promise<Group> => {
    const response = await fetch(`${ACADEMICS_URL}/groups/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch group');
    return response.json();
};