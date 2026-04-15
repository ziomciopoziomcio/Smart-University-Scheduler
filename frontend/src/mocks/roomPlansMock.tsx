import type {ScheduleEntry} from '@api/types';

export interface CampusItem {
    id: string;
    name: string;
}

export interface BuildingItem {
    id: string;
    campusId: string;
    name: string;
}

export interface RoomItem {
    id: string;
    campusId: string;
    buildingId: string;
    name: string;
}

export const campusesMock: CampusItem[] = [
    {id: 'a', name: 'Kampus A'},
    {id: 'b', name: 'Kampus B'},
];

export const buildingsMock: BuildingItem[] = [
    {id: 'a1', campusId: 'a', name: 'Budynek A1'},
    {id: 'a11', campusId: 'a', name: 'Budynek A11'},
    {id: 'b2', campusId: 'b', name: 'Budynek B2'},
];

export const roomsMock: RoomItem[] = [
    {id: 'e5', campusId: 'a', buildingId: 'a11', name: 'Aula E5'},
    {id: 'l2', campusId: 'a', buildingId: 'a11', name: 'Sala L2'},
    {id: '204', campusId: 'b', buildingId: 'b2', name: 'Sala 204'},
];

export const roomScheduleMock: Record<string, ScheduleEntry[]> = {
    e5: [
        {
            id: 'r1',
            title: 'Programowanie\nsieciowe 1',
            date: '2026-04-13',
            startHour: 10,
            endHour: 12,
            variant: 'lecture',
        },
        {
            id: 'r2',
            title: 'Matematyka\ndyskretna',
            date: '2026-04-15',
            startHour: 12,
            endHour: 14,
            variant: 'exercise',
        },
        {
            id: 'r3',
            title: 'Analiza\ndanych',
            date: '2026-04-20',
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
    ],
    l2: [
        {
            id: 'r4',
            title: 'Programowanie\nsieciowe 1',
            date: '2026-04-14',
            startHour: 11,
            endHour: 13,
            variant: 'lab',
        },
        {
            id: 'r5',
            title: 'Systemy\nrozproszone',
            date: '2026-04-21',
            startHour: 9,
            endHour: 11,
            variant: 'lab',
        },
    ],
    '204': [
        {
            id: 'r6',
            title: 'Projektowanie\ninterfejsów aplikacji\nWWW',
            date: '2026-04-14',
            startHour: 8,
            endHour: 10,
            variant: 'project',
        },
    ],
};