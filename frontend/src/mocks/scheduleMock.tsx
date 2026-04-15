import type {ScheduleEntry} from '@api/types';

export const scheduleMock: ScheduleEntry[] = [
    {
        id: '1',
        title: 'Programowanie\nsieciowe 1',
        date: '2026-03-09',
        startHour: 10,
        endHour: 12,
        variant: 'lecture',
    },
    {
        id: '2',
        title: 'Projektowanie\ninterfejsów aplikacji\nWWW',
        date: '2026-03-10',
        startHour: 8,
        endHour: 10,
        variant: 'project',
    },
    {
        id: '3',
        title: 'Programowanie\nsieciowe 1',
        date: '2026-03-10',
        startHour: 11,
        endHour: 13,
        variant: 'lab',
    },
    {
        id: '4',
        title: 'Podstawy\nkonteneryzacji i\narchitektury\nmikroserwisów',
        date: '2026-03-11',
        startHour: 8,
        endHour: 16,
        variant: 'lab',
    },
    {
        id: '5',
        title: 'Matematyka\ndyskretna',
        date: '2026-03-16',
        startHour: 12,
        endHour: 14,
        variant: 'exercise',
    },
    {
        id: '6',
        title: 'Architektura\noprogramowania',
        date: '2026-03-17',
        startHour: 9,
        endHour: 11,
        variant: 'lecture',
    },
];