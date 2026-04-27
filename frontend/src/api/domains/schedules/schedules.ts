import {getHeaders, SCHEDULES_URL} from '@api/core';
import {type CourseSessionDetailsResponse, type ScheduleVersion} from './types';

export const fetchCourseSessionDetails = async (
    sessionId: string,
): Promise<CourseSessionDetailsResponse> => {
    const response = await fetch(`${SCHEDULES_URL}/session/${sessionId}/details`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch course session details');
    }

    return response.json();
};

export const generateSchedule = async (): Promise<ScheduleVersion> => {
    const response = await fetch(`${SCHEDULES_URL}/generate`, {
        method: 'POST',
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to generate schedule');
    }

    return response.json();
};