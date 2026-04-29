import {COURSES_URL, type PaginatedResponse, getHeaders} from '@api/core';
import type {StudyField, StudyFieldCreate, StudyPlanGroupSummary, StudyFieldUpdate} from './types';


export const fetchStudyFields = async (
    page = 1,
    limit = 10,
    search?: string,
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

    if (search) query.append('search', search);

    const response = await fetch(`${COURSES_URL}/study-fields?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać listy kierunków');
    return response.json();
};

export const getStudyField = async (id: number): Promise<StudyField> => {
    const response = await fetch(`${COURSES_URL}/study-fields/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów kierunku');
    return response.json();
};


export const createStudyField = async (payload: StudyFieldCreate): Promise<StudyField> => {
    const response = await fetch(`${COURSES_URL}/study-fields`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się utworzyć kierunku');
    return response.json();
};


export const updateStudyField = async (id: number, payload: StudyFieldUpdate): Promise<StudyField> => {
    const response = await fetch(`${COURSES_URL}/study-fields/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się zaktualizować kierunku');
    return response.json();
};


export const deleteStudyField = async (id: number): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/study-fields/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się usunąć kierunku');
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