import type {StudyProgramDetails, MajorDetails, ElectiveBlock, Group, Major, PaginatedResponse, StudyField, StudyPlanGroupSummary} from './types';
import {useAuthStore} from "@store/useAuthStore.ts";

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const COURSE_URL = (baseApiUrl ? `${baseApiUrl}/course` : 'http://localhost:3000/course').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

export const fetchStudyPrograms = async (
    limit = 100,
    offset = 0,
    studyFieldId?: number
): Promise<PaginatedResponse<StudyProgramDetails>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
    if (studyFieldId) params.append('study_field', studyFieldId.toString());

    const response = await fetch(`${COURSE_URL}/study-programs?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kierunków studiów');
    return response.json();
};

// export const fetchMajors = async (
//     limit = 100,
//     offset = 0,
//     studyFieldId?: number
// ): Promise<PaginatedResponse<MajorDetails>> => {
//     const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
//     if (studyFieldId) params.append('study_field', studyFieldId.toString());
//
//     const response = await fetch(`${COURSE_URL}/majors?${params.toString()}`, {headers: getHeaders()});
//     if (!response.ok) throw new Error('Nie udało się pobrać specjalności');
//     return response.json();
// };

export const fetchStudyFields = async (
    page: number = 1,
    limit: number = 10,
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

    const response = await fetch(`${COURSE_URL}/study-fields?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch study field');
    return response.json();
};

export const getStudyField = async (id: number): Promise<StudyField> => {
    const response = await fetch(`${COURSE_URL}/study-fields/${id}`, {
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch data about study field');
    return response.json();
};

export const fetchMajors = async (
    page: number = 1,
    limit: number = 100,
    filters: {
        study_field?: number;
        major_name?: string;
    } = {}
): Promise<PaginatedResponse<Major>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_field !== undefined && {study_field: filters.study_field.toString()}),
        ...(filters.major_name && {major_name: filters.major_name}),
    });

    const response = await fetch(`${COURSE_URL}/majors?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch majors');
    return response.json();
};

export const fetchElectiveBlocks = async (
    page: number = 1,
    limit: number = 100,
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

    const response = await fetch(`${COURSE_URL}/elective-blocks?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch elective blocks');
    return response.json();
};

export const getMajor = async (id: number): Promise<Major> => {
    const response = await fetch(`${COURSE_URL}/majors/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch major');
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
        `${COURSE_URL}/study-fields/${fieldOfStudyId}/semesters/${semesterNumber}/groups?${query.toString()}`,
        {
            headers: getHeaders(),
        },
    );

    if (!response.ok) throw new Error('Failed to fetch study plan groups');
    return response.json();
};