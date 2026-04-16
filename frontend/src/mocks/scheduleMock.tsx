import type {ScheduleEntry} from '@api/types';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';

interface MockEntrySeed {
    id: string;
    title: string;
    weekOffset: number;
    dayOffset: number;
    startTime: string;
    endTime: string;
    variant: ScheduleEntry['variant'];
}

const currentWeekStart = getStartOfWeek(new Date());

const createIsoDate = (weekOffset: number, dayOffset: number) => {
    return toIsoDate(addDays(addWeeks(currentWeekStart, weekOffset), dayOffset));
};

const scheduleSeeds: MockEntrySeed[] = [
    {
        id: '1',
        title: 'Programowanie\nsieciowe 1',
        weekOffset: 0,
        dayOffset: 0,
        startTime: '10:15',
        endTime: '11:45',
        variant: 'lecture',
    },
    {
        id: '2',
        title: 'Projektowanie\ninterfejsów aplikacji\nWWW',
        weekOffset: 0,
        dayOffset: 1,
        startTime: '08:15',
        endTime: '09:45',
        variant: 'project',
    },
    {
        id: '3',
        title: 'Programowanie\nsieciowe 1',
        weekOffset: 0,
        dayOffset: 1,
        startTime: '11:15',
        endTime: '12:45',
        variant: 'lab',
    },
    {
        id: '4',
        title: 'Podstawy\nkonteneryzacji i\narchitektury\nmikroserwisów',
        weekOffset: 0,
        dayOffset: 2,
        startTime: '08:15',
        endTime: '15:45',
        variant: 'lab',
    },
    {
        id: '5',
        title: 'Matematyka\ndyskretna',
        weekOffset: 0,
        dayOffset: 3,
        startTime: '12:15',
        endTime: '13:45',
        variant: 'exercise',
    },
    {
        id: '6',
        title: 'Architektura\noprogramowania',
        weekOffset: 0,
        dayOffset: 4,
        startTime: '09:15',
        endTime: '10:45',
        variant: 'lecture',
    },
    {
        id: '7',
        title: 'Systemy\nrozproszone',
        weekOffset: 1,
        dayOffset: 1,
        startTime: '10:15',
        endTime: '11:45',
        variant: 'lab',
    },
    {
        id: '8',
        title: 'Seminarium\ndyplomowe',
        weekOffset: 1,
        dayOffset: 3,
        startTime: '14:15',
        endTime: '15:45',
        variant: 'seminar',
    },
    {
        id: '9',
        title: 'Bazy\ndanych',
        weekOffset: -1,
        dayOffset: 2,
        startTime: '08:15',
        endTime: '09:45',
        variant: 'lecture',
    },
    {
        id: '10',
        title: 'Uczenie\nmaszynowe',
        weekOffset: -1,
        dayOffset: 4,
        startTime: '12:15',
        endTime: '13:45',
        variant: 'project',
    },
];

export const scheduleMock: ScheduleEntry[] = scheduleSeeds.map((entry) => ({
    id: entry.id,
    title: entry.title,
    date: createIsoDate(entry.weekOffset, entry.dayOffset),
    startTime: entry.startTime,
    endTime: entry.endTime,
    variant: entry.variant,
}));