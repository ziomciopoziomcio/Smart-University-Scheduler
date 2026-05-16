import {COURSES_URL, getHeaders, type PaginatedResponse} from '@api/core';
import type {CourseTypeDetail, CourseTypeDetailCreate, CourseTypeDetailUpdate} from './types';

export const fetchCourseTypes = async (
    courseCode: number,
    page = 1,
    limit = 100
): Promise<PaginatedResponse<CourseTypeDetail>> => {
    const offset = (page - 1) * limit;
    const response = await fetch(`${COURSES_URL}/types?course=${courseCode}&limit=${limit}&offset=${offset}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać typów zajęć dla przedmiotu');
    return response.json();
};

export const createCourseType = async (payload: CourseTypeDetailCreate): Promise<CourseTypeDetail> => {
    const response = await fetch(`${COURSES_URL}/types`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się utworzyć typu zajęć');
    return response.json();
};

export const updateCourseType = async (
    courseCode: number,
    classType: string,
    payload: CourseTypeDetailUpdate
): Promise<CourseTypeDetail> => {
    const response = await fetch(`${COURSES_URL}/types/${courseCode}/${classType}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się zaktualizować typu zajęć');
    return response.json();
};

export const deleteCourseType = async (courseCode: number, classType: string): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/types/${courseCode}/${classType}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się usunąć typu zajęć');
};
