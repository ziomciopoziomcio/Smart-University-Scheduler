import {COURSES_URL, type PaginatedResponse, getHeaders} from '@api/core';
import type {Course, CourseFilters} from './types';


export const fetchCourses = async (
    limit = 100,
    offset = 0,
    filters: CourseFilters = {}
): Promise<PaginatedResponse<Course>> => {
    const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(filters.min_ects_points !== undefined && {min_ects_points: filters.min_ects_points.toString()}),
        ...(filters.max_ects_points !== undefined && {max_ects_points: filters.max_ects_points.toString()}),
        ...(filters.language && {language: filters.language}),
    });

    const response = await fetch(`${COURSES_URL}?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać katalogu przedmiotów');
    return response.json();
};

export const getCourse = async (courseCode: number): Promise<Course> => {
    const response = await fetch(`${COURSES_URL}/${courseCode}`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów przedmiotu');
    return response.json();
};

export const createCourse = async (payload: Course): Promise<Course> => {
    const response = await fetch(`${COURSES_URL}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się utworzyć przedmiotu');
    return response.json();
};

export const updateCourse = async (courseCode: number, payload: Course): Promise<Course> => {
    const response = await fetch(`${COURSES_URL}/${courseCode}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Nie udało się zaktualizować przedmiotu');
    return response.json();
};


export const deleteCourse = async (courseCode: number): Promise<void> => {
    const response = await fetch(`${COURSES_URL}/${courseCode}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Nie udało się usunąć przedmiotu');
};