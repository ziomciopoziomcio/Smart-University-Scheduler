import {getHeaders, SCHEDULES_URL} from '@api/core';

import type {
    FetchRoomPlanParams,
    RoomPlanApiEntry,
    ScheduleEntry,
} from './types';

import {createQueryParams, mapScheduleEntries} from './utils';

export const fetchRoomPlan = async ({
    campusId,
    buildingId,
    roomId,
    startDate,
}: FetchRoomPlanParams): Promise<ScheduleEntry[]> => {
    const query = createQueryParams({
        campus_id: campusId,
        building_id: buildingId,
        room_id: roomId,
        start_date: startDate,
    });

    const response = await fetch(`${SCHEDULES_URL}/room-plan?${query.toString()}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch room plan');
    }

    const data: RoomPlanApiEntry[] = await response.json();

    return mapScheduleEntries(data);
};