import {getHeaders, SCHEDULES_URL} from '@api/core';

import type {
    FetchStudyFieldPlanParams,
    ScheduleEntry,
    StudyFieldPlanApiEntry,
} from './types';

import {createQueryParams, mapScheduleEntries} from './utils';

export const fetchStudyFieldPlan = async ({
    startDate,
    studyField,
    semester,
    specializationId,
    electiveBlockId,
    groupId,
}: FetchStudyFieldPlanParams): Promise<ScheduleEntry[]> => {
    const query = createQueryParams({
        start_date: startDate,
        study_field: studyField,
        semester,
        specialization_id: specializationId,
        elective_block_id: electiveBlockId,
        group_id: groupId,
    });

    const response = await fetch(`${SCHEDULES_URL}/study-field-plan?${query.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch study field plan');
    }

    const data: StudyFieldPlanApiEntry[] = await response.json();

    return mapScheduleEntries(data);
};