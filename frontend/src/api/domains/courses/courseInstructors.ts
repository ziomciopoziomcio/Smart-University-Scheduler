import { COURSES_URL, ACADEMICS_URL, getHeaders, type PaginatedResponse, type ClassType } from '@api/core';
import type { CourseInstructor } from './types';

export interface FacultyInstructor {
    id: number;
    name: string;
    surname: string;
    degree: string | null;
}

export const fetchFacultyInstructors = async (facultyId: number): Promise<FacultyInstructor[]> => {
    const response = await fetch(`${ACADEMICS_URL}/instructors/by-faculty/${facultyId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Błąd pobierania prowadzących z wydziału');
    return response.json();
};

export const fetchCourseInstructors = async (courseCode: number): Promise<PaginatedResponse<CourseInstructor>> => {
    const response = await fetch(`${COURSES_URL}/instructors?course=${courseCode}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Błąd pobierania przypisań');
    return response.json();
};

export const createCourseInstructor = async (payload: CourseInstructor): Promise<CourseInstructor> => {
    const response = await fetch(`${COURSES_URL}/instructors`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się przypisać prowadzącego');
    return response.json();
};

export const deleteCourseInstructor = async (employeeId: number, courseCode: number, classType: ClassType): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/instructors/${employeeId}/${courseCode}/${classType}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć przypisania');
};

export const updateCourseInstructor = async (
    employeeId: number,
    courseCode: number,
    classType: string,
    payload: { hours: number }
): Promise<CourseInstructor> => {
    const response = await fetch(`${COURSES_URL}/instructors/${employeeId}/${courseCode}/${classType}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować godzin');
    return response.json();
};