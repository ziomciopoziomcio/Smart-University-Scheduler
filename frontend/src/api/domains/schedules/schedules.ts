import {
    BASE_URL, getHeaders, SCHEDULES_URL, OPTIMIZE_URL,
    SETTINGS_URL
} from '@api/core';

import type {
    CourseSessionDetailsResponse,
    GenerateScheduleRequest,
    ScheduleSessionEditOptionsResponse,
    ScheduleVersion,
    UpdateScheduleSessionRequest,
    PlannerSettings,
    PlannerSettingsPayload,
    ValidationReport,
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
    const response = await fetch(`${OPTIMIZE_URL}/run`, {
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

    throw new Error(
        await getApiErrorMessage(
            response,
            'Failed to update schedule session',
        ),
    );
};

export const fetchPlannerSettings = async (
    facultyId: number,
): Promise<PlannerSettings | null> => {
    const response = await fetch(
        `${SETTINGS_URL}/planner-settings?faculty_id=${facultyId}`,
        {
            headers: getHeaders(),
        },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            await getApiErrorMessage(
                response,
                'Failed to fetch planner settings',
            ),
        );
    }

    const settings: PlannerSettings[] = await response.json();

    return settings[0] ?? null;
};

export const createPlannerSettings = async (
    payload: PlannerSettingsPayload,
): Promise<PlannerSettings> => {
    const response = await fetch(
        `${SETTINGS_URL}/planner-settings`,
        {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        throw new Error(
            await getApiErrorMessage(
                response,
                'Failed to create planner settings',
            ),
        );
    }

    return response.json();
};

export const updatePlannerSettings = async (
    settingsId: number,
    payload: PlannerSettingsPayload,
): Promise<PlannerSettings> => {
    const response = await fetch(
        `${SETTINGS_URL}/planner-settings/${settingsId}`,
        {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        throw new Error(
            await getApiErrorMessage(
                response,
                'Failed to update planner settings',
            ),
        );
    }

    return response.json();
};

export const validateOptimizationData = async (
    facultyId: number,
): Promise<ValidationReport> => {
    const response = await fetch(
        `${OPTIMIZE_URL}/validate/${facultyId}`,
        {
            headers: getHeaders(),
        },
    );

    if (!response.ok) {
        throw new Error(
            await getApiErrorMessage(
                response,
                'Failed to validate optimization data',
            ),
        );
    }

    return response.json();
};

const getApiErrorMessage = async (
    response: Response,
    fallbackMessage: string,
): Promise<string> => {
    try {
        const data: unknown = await response.json();

        if (
            typeof data === 'object' &&
            data !== null &&
            'detail' in data
        ) {
            const detail = (data as { detail: unknown }).detail;

            if (typeof detail === 'string') {
                return detail;
            }

            if (
                typeof detail === 'object' &&
                detail !== null &&
                'message' in detail &&
                typeof (detail as { message: unknown }).message === 'string'
            ) {
                return (detail as { message: string }).message;
            }

            return JSON.stringify(detail);
        }
    } catch {
    }

    return fallbackMessage;
};