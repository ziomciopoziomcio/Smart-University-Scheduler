import {BASE_URL, getHeaders, SCHEDULES_URL} from '@api/core';

import type {
    CourseSessionDetailsResponse,
    GenerateScheduleRequest,
    ScheduleSessionEditOptionsResponse,
    ScheduleVersion,
    UpdateScheduleSessionRequest,
} from './types';

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

export const fetchScheduleSessionEditOptions = async (
    sessionId: string,
): Promise<ScheduleSessionEditOptionsResponse> => {
    const response = await fetch(
        `${SCHEDULES_URL}/session/${sessionId}/edit-options`,
        {
            headers: getHeaders(),
        },
    );

    if (!response.ok) {
        throw new Error('Failed to fetch schedule session edit options');
    }

    return response.json();
};

export const generateSchedule = async (
    payload?: GenerateScheduleRequest,
): Promise<ScheduleVersion> => {
    const response = await fetch(`${BASE_URL}/optimize/run`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload?.faculty_id
            ? JSON.stringify({faculty_id: payload.faculty_id})
            : undefined,
    });

    if (!response.ok) {
        throw new Error('Failed to generate schedule');
    }

    return response.json();
};

export const updateScheduleSession = async (
    sessionId: string,
    payload: UpdateScheduleSessionRequest,
): Promise<void> => {
    const response = await fetch(`${SCHEDULES_URL}/session/${sessionId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (response.status === 204) {
        return;
    }

    if (response.status === 409) {
        throw new Error('Schedule update conflict');
    }

    if (!response.ok) {
        throw new Error('Failed to update schedule session');
    }
};