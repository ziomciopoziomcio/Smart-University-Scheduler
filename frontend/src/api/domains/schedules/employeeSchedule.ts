import {getHeaders, SCHEDULES_URL} from '@api/core';

import type {
    FetchLecturerPlanParams,
    LecturerPlanApiEntry,
    ScheduleEntry,
} from './types';

import {createQueryParams, mapScheduleEntries} from './utils';

export const fetchLecturerPlan = async ({
    instructorId,
    startDate,
    unitId,
}: FetchLecturerPlanParams): Promise<ScheduleEntry[]> => {
    const query = createQueryParams({
        instructor_id: instructorId,
        start_date: startDate,
        unit_id: unitId,
    });

    const response = await fetch(`${SCHEDULES_URL}/lecturer-plan?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch lecturer plan');
    }

    const data: LecturerPlanApiEntry[] = await response.json();

    return mapScheduleEntries(data);
};