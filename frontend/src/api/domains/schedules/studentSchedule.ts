import {getHeaders, SCHEDULES_URL} from '@api/core';

import type {
    FetchStudentPlanParams,
    ScheduleEntry,
    StudentPlanApiEntry,
} from './types';

import {createQueryParams, mapScheduleEntries} from './utils';

export const fetchStudentPlan = async ({
    userId,
    startDate,
}: FetchStudentPlanParams): Promise<ScheduleEntry[]> => {
    const query = createQueryParams({
        user_id: userId,
        start_date: startDate,
    });

    const response = await fetch(`${SCHEDULES_URL}/user-plan?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch student plan');
    }

    const data: StudentPlanApiEntry[] = await response.json();

    return mapScheduleEntries(data);
};