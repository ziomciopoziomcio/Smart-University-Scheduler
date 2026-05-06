import {getHeaders, type PaginatedResponse, ACADEMICS_URL} from '@api/core';
import {type Group, type GroupCreate, type GroupUpdate, type StudyPlanGroupSummary} from './types.ts';

export const fetchGroups = async (
    page = 1,
    limit = 100,
    filters: {
        study_program?: number;
        major?: number;
        elective_block?: number;
        group_name?: string;
        semester?: number;
    } = {},
    search?: string
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
        ...(filters.semester !== undefined && {
            semester: filters.semester.toString()
        }),
        ...(filters.group_name && {
            group_name: filters.group_name,
        }),
    });

    if (search) query.append('search', search);

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

export const fetchStudyPlanGroupsSummary = async (params: {
    faculty_id: number;
    study_field: number;
    semester: number;
    specialization_id?: number;
    elective_block_id?: number;
}): Promise<StudyPlanGroupSummary[]> => {
    const query = new URLSearchParams({
        faculty_id: params.faculty_id.toString(),
        study_field: params.study_field.toString(),
        semester: params.semester.toString(),
        ...(params.specialization_id !== undefined && {
            specialization_id: params.specialization_id.toString(),
        }),
        ...(params.elective_block_id !== undefined && {
            elective_block_id: params.elective_block_id.toString(),
        }),
    });

    const response = await fetch(`${ACADEMICS_URL}/groups/summary?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch study plan groups summary');
    }

    return response.json();
};

export const createGroup = async (payload: GroupCreate): Promise<Group> => {
    const response = await fetch(`${ACADEMICS_URL}/groups`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć grupy');
    return response.json();
};

export const updateGroup = async (id: number, payload: GroupUpdate): Promise<Group> => {
    const response = await fetch(`${ACADEMICS_URL}/groups/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować grupy');
    return response.json();
};

export const deleteGroup = async (id: number): Promise<void> => {
    const response = await fetch(`${ACADEMICS_URL}/groups/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć grupy');
};