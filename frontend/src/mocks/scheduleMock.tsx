import type {ScheduleEntry} from '@api/types';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';

interface MockEntrySeed {
    id: string;
    title: string;
    weekOffset: number;
    dayOffset: number;
    startHour: number;
    endHour: number;
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
        startHour: 10,
        endHour: 11.30,
        variant: 'lecture',
    },
    {
        id: '2',
        title: 'Projektowanie\ninterfejsów aplikacji\nWWW',
        weekOffset: 0,
        dayOffset: 1,
        startHour: 8,
        endHour: 10,
        variant: 'project',
    },
    {
        id: '3',
        title: 'Programowanie\nsieciowe 1',
        weekOffset: 0,
        dayOffset: 1,
        startHour: 11,
        endHour: 13,
        variant: 'lab',
    },
    {
        id: '4',
        title: 'Podstawy\nkonteneryzacji i\narchitektury\nmikroserwisów',
        weekOffset: 0,
        dayOffset: 2,
        startHour: 8,
        endHour: 16,
        variant: 'lab',
    },
    {
        id: '5',
        title: 'Matematyka\ndyskretna',
        weekOffset: 0,
        dayOffset: 3,
        startHour: 12,
        endHour: 14,
        variant: 'exercise',
    },
    {
        id: '6',
        title: 'Architektura\noprogramowania',
        weekOffset: 0,
        dayOffset: 4,
        startHour: 9,
        endHour: 11,
        variant: 'lecture',
    },
    {
        id: '7',
        title: 'Systemy\nrozproszone',
        weekOffset: 1,
        dayOffset: 1,
        startHour: 10,
        endHour: 12,
        variant: 'lab',
    },
    {
        id: '8',
        title: 'Seminarium\ndyplomowe',
        weekOffset: 1,
        dayOffset: 3,
        startHour: 14,
        endHour: 16,
        variant: 'seminar',
    },
    {
        id: '9',
        title: 'Bazy\ndanych',
        weekOffset: -1,
        dayOffset: 2,
        startHour: 8,
        endHour: 10,
        variant: 'lecture',
    },
    {
        id: '10',
        title: 'Uczenie\nmaszynowe',
        weekOffset: -1,
        dayOffset: 4,
        startHour: 12,
        endHour: 14,
        variant: 'project',
    },
];

export const scheduleMock: ScheduleEntry[] = scheduleSeeds.map((entry) => ({
    id: entry.id,
    title: entry.title,
    date: createIsoDate(entry.weekOffset, entry.dayOffset),
    startHour: entry.startHour,
    endHour: entry.endHour,
    variant: entry.variant,
}));