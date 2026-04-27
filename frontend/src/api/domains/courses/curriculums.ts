import {type PaginatedResponse, COURSES_URL, getHeaders} from "@api/core";
import type {CurriculumCourse, CurriculumCourseCreate, CurriculumCourseUpdate, CurriculumFilters} from "./types";

export const fetchCurriculum = async (
    limit = 100,
    offset = 0,
    filters: CurriculumFilters = {}
): Promise<PaginatedResponse<CurriculumCourse>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});

    if (filters.study_program) params.append('study_program', filters.study_program.toString());
    if (filters.semester) params.append('semester', filters.semester.toString());
    if (filters.major) params.append('major', filters.major.toString());
    if (filters.elective_block) params.append('elective_block', filters.elective_block.toString());

    const response = await fetch(`${COURSES_URL}/curriculum?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać siatki godzin');
    return response.json();
};

export const createCurriculumCourse = async (payload: CurriculumCourseCreate): Promise<CurriculumCourse> => {
    const response = await fetch(`${COURSES_URL}/curriculum`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się przypisać przedmiotu do programu');
    return response.json();
};

export const updateCurriculumCourse = async (
    studyProgram: number,
    courseCode: number,
    semester: number,
    payload: CurriculumCourseUpdate
): Promise<CurriculumCourse> => {
    const response = await fetch(`${COURSES_URL}/curriculum/${studyProgram}/${courseCode}/${semester}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować przedmiotu w siatce');
    return response.json();
};

export const deleteCurriculumCourse = async (
    studyProgram: number,
    courseCode: number,
    semester: number
): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/curriculum/${studyProgram}/${courseCode}/${semester}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć przedmiotu z siatki');
};