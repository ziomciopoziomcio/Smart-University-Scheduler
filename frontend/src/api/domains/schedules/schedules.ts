import {getHeaders, SCHEDULES_URL} from '@api/core';
import {
    type CourseSessionDetailsResponse, type ScheduleVersion, type UpdateScheduleSessionRequest
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

//TODO: IT DOES NOT WORK
// https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/223

export const updateScheduleSession = async (
    sessionId: string,
    payload: UpdateScheduleSessionRequest,
): Promise<void> => {
    const response = await fetch(`${SCHEDULES_URL}/sessions/${sessionId}`, {
        method: 'PATCH',
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