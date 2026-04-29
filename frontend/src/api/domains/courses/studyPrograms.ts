import {type PaginatedResponse, COURSES_URL, getHeaders} from "@api/core";
import type {StudyProgram, StudyProgramCreate, StudyProgramUpdate} from "./types";

export const fetchStudyPrograms = async (
    page = 1,
    limit = 10,
    search?: string,
    filters: {
        study_field?: number;
        start_year?: string;
        program_name?: string;
    } = {}
): Promise<PaginatedResponse<StudyProgram>> => {
    const offset = (page - 1) * limit;
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});

    if (search) params.append('search', search);
    if (filters.study_field) params.append('study_field', filters.study_field.toString());
    if (filters.start_year) params.append('start_year', filters.start_year);
    if (filters.program_name) params.append('program_name', filters.program_name);

    const response = await fetch(`${COURSES_URL}/study-programs?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać programów studiów');
    return response.json();
};

export const getStudyProgram = async (id: number): Promise<StudyProgram> => {
    const response = await fetch(`${COURSES_URL}/study-programs/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów programu');
    return response.json();
};

export const createStudyProgram = async (payload: StudyProgramCreate): Promise<StudyProgram> => {
    const response = await fetch(`${COURSES_URL}/study-programs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć programu studiów');
    return response.json();
};

export const updateStudyProgram = async (id: number, payload: StudyProgramUpdate): Promise<StudyProgram> => {
    const response = await fetch(`${COURSES_URL}/study-programs/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować programu studiów');
    return response.json();
};

export const deleteStudyProgram = async (id: number): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/study-programs/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć programu studiów');
};