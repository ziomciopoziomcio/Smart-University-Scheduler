import {getHeaders, SCHEDULES_URL} from '@api/core';
import type {ScheduleEntry} from './types';

export interface FetchStudyFieldPlanParams {
    startDate: string;
    studyProgram: number;
    studyField: number;
    semester: number;
    specializationId?: number | null;
    electiveBlockId?: number | null;
    groupIds?: number[];
}

export const fetchStudyFieldPlan = async ({
    startDate,
    studyProgram,
    studyField,
    semester,
    specializationId,
    electiveBlockId,
    groupIds,
}: FetchStudyFieldPlanParams): Promise<ScheduleEntry[]> => {
    const params = new URLSearchParams({
        start_date: startDate,
        study_program: String(studyProgram),
        study_field: String(studyField),
        semester: String(semester),
    });

    if (specializationId != null) {
        params.set('specialization_id', String(specializationId));
    }

    if (electiveBlockId != null) {
        params.set('elective_block_id', String(electiveBlockId));
    }

    groupIds?.forEach((groupId) => {
        params.append('group_ids', String(groupId));
    });

    const response = await fetch(`${SCHEDULES_URL}/study-field-plan?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch study field plan');
    }

    return response.json();
};