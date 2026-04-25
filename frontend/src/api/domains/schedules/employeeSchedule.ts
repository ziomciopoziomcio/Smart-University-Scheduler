import {getHeaders, SCHEDULES_URL} from '@api/core';
import {type ScheduleEntry} from './types';

type LecturerPlanApiEntry = {
    id: string;
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    start_time?: string;
    end_time?: string;
    variant: string;
};

export const fetchLecturerPlan = async (params: {
    instructorId: number;
    startDate: string;
    unitId?: number;
}): Promise<ScheduleEntry[]> => {
    const query = new URLSearchParams({
        instructor_id: params.instructorId.toString(),
        start_date: params.startDate,
        ...(params.unitId !== undefined && {
            unit_id: params.unitId.toString(),
        }),
    });

    const response = await fetch(`${SCHEDULES_URL}/lecturer-plan?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch lecturer plan');
    }

    const data: LecturerPlanApiEntry[] = await response.json();

    return data.map((entry) => ({
        id: entry.id,
        title: entry.title,
        date: entry.date,
        startTime: entry.startTime ?? entry.start_time ?? '',
        endTime: entry.endTime ?? entry.end_time ?? '',
        variant: entry.variant,
    }));
};