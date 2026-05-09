import {getHeaders, SCHEDULES_URL} from '@api/core';
import {type ScheduleEntry, type RoomPlanApiEntry} from './types';

type ScheduleEntryVariant = ScheduleEntry['variant'];

const mapVariantToScheduleVariant = (
    variant?: string | null,
): ScheduleEntryVariant => {
    const normalized = variant?.toLowerCase();

    switch (normalized) {
        case 'lecture':
            return 'lecture';

        case 'laboratory':
            return 'lab';

        case 'tutorials':
            return 'exercise';

        case 'seminar':
            return 'seminar';

        case 'project':
            return 'project';

        default:
            return 'lecture';
    }
};

export const fetchRoomPlan = async (params: {
    roomId: number;
    startDate: string;
}): Promise<ScheduleEntry[]> => {
    const query = new URLSearchParams({
        room_id: params.roomId.toString(),
        start_date: params.startDate,
    });

    const response = await fetch(`${SCHEDULES_URL}/room-plan?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać planu sali');
    }

    const data: RoomPlanApiEntry[] = await response.json();

    return data.map((entry) => ({
        id: entry.id,
        title: entry.title,
        date: entry.date,
        startTime: entry.startTime ?? entry.start_time ?? '',
        endTime: entry.endTime ?? entry.end_time ?? '',
        variant: mapVariantToScheduleVariant(entry.variant),
    }));
};