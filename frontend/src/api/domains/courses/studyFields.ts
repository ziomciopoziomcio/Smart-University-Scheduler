import {COURSES_URL, type PaginatedResponse, getHeaders} from '@api/core';
import type {StudyField} from './types';
import {type StudyPlanGroupSummary} from '@api';

export const fetchStudyFields = async (
    page = 1,
    limit = 10,
    filters: {
        faculty?: number;
        field_name?: string;
    } = {}
): Promise<PaginatedResponse<StudyField>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.faculty !== undefined && {faculty: filters.faculty.toString()}),
        ...(filters.field_name && {field_name: filters.field_name}),
    });

    const response = await fetch(`${COURSES_URL}/study-fields?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch study field');
    return response.json();
};

export const getStudyField = async (id: number): Promise<StudyField> => {
    const response = await fetch(`${COURSES_URL}/study-fields/${id}`, {
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch data about study field');
    return response.json();
};

//TODO: NOT WORKING YET!!!!!!
export const fetchStudyPlanGroups = async (
    fieldOfStudyId: number,
    semesterNumber: number,
    filters: {
        specialization_id?: number;
        elective_block_id?: number;
    } = {},
): Promise<StudyPlanGroupSummary[]> => {
    const query = new URLSearchParams({
        ...(filters.specialization_id !== undefined && {
            specialization_id: filters.specialization_id.toString(),
        }),
        ...(filters.elective_block_id !== undefined && {
            elective_block_id: filters.elective_block_id.toString(),
        }),
    });

    const response = await fetch(
        `${COURSES_URL}/study-fields/${fieldOfStudyId}/semesters/${semesterNumber}/groups?${query.toString()}`,
        {
            headers: getHeaders(),
        },
    );

    if (!response.ok) throw new Error('Failed to fetch study plan groups');
    return response.json();
};