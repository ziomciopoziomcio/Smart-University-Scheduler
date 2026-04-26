import {COURSES_URL, type PaginatedResponse, getHeaders} from "@api/core";
import type {Major} from "./types";

export const fetchMajors = async (
    page = 1,
    limit = 100,
    filters: {
        study_field?: number;
        major_name?: string;
        semester?: number;
    } = {},
): Promise<PaginatedResponse<Major>> => {
    const offset = (page - 1) * limit;

    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.study_field !== undefined && {
            study_field: filters.study_field.toString(),
        }),
        ...(filters.major_name && {
            major_name: filters.major_name,
        }),
        ...(filters.semester !== undefined && {
            semester: filters.semester.toString(),
        }),
    });

    const response = await fetch(`${COURSES_URL}/majors?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch majors');
    }

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

export const getMajor = async (id: number): Promise<Major> => {
    const response = await fetch(`${COURSES_URL}/majors/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch major');
    return response.json();
};