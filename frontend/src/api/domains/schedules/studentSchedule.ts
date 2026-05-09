import {getHeaders, SCHEDULES_URL} from '@api/core';

import type {
    FetchStudentPlanParams,
    ScheduleEntry,
    StudentPlanApiEntry,
} from './types';

import {createQueryParams, mapScheduleEntries} from './utils';

////TODO: https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/275
export const fetchStudentPlan = async ({
    studentId,
    startDate,
}: FetchStudentPlanParams): Promise<ScheduleEntry[]> => {
    const query = createQueryParams({
        student_id: studentId,
        start_date: startDate,
    });

    const response = await fetch(`${SCHEDULES_URL}/student-plan?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch student plan');
    }

    const data: StudentPlanApiEntry[] = await response.json();

    return mapScheduleEntries(data);
};