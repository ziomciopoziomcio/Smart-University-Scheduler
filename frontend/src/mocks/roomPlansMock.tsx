import type {ScheduleEntry} from '@api';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';

//TO JEST DO ROOM SCHEDULE TYLKO JUZ
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

interface RoomScheduleParams {
    campusId: string;
    buildingId: string;
    roomId: string;
}

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

const mapSeedsToEntries = (prefix: string, seeds: MockEntrySeed[]): ScheduleEntry[] => {
    return seeds.map((seed) => ({
        id: `${prefix}-${seed.id}`,
        title: seed.title,
        date: createIsoDate(seed.weekOffset, seed.dayOffset),
        startTime: seed.startTime,
        endTime: seed.endTime,
        variant: seed.variant,
    }));
};

const humanizeRoomId = (roomId: string) => roomId.toUpperCase();

export const campusesMock: CampusItem[] = [
    {id: 'a', name: 'Kampus A'},
    {id: 'b', name: 'Kampus B'},
    {id: 'c', name: 'Kampus C'},
];

export const buildingsMock: BuildingItem[] = [
    {id: 'a1', campusId: 'a', name: 'Budynek A1'},
    {id: 'a11', campusId: 'a', name: 'Budynek A11'},
    {id: 'a12', campusId: 'a', name: 'Budynek A12'},
    {id: 'b2', campusId: 'b', name: 'Budynek B2'},
    {id: 'b4', campusId: 'b', name: 'Budynek B4'},
    {id: 'c1', campusId: 'c', name: 'Budynek C1'},
];

export const roomsMock: RoomItem[] = [
    {id: 'e5', campusId: 'a', buildingId: 'a11', name: 'Aula E5'},
    {id: 'l2', campusId: 'a', buildingId: 'a11', name: 'Sala L2'},
    {id: 'f3', campusId: 'a', buildingId: 'a12', name: 'Sala F3'},
    {id: '204', campusId: 'b', buildingId: 'b2', name: 'Sala 204'},
    {id: '301', campusId: 'b', buildingId: 'b4', name: 'Sala 301'},
    {id: '18', campusId: 'c', buildingId: 'c1', name: 'Sala 18'},
];

const roomScheduleSeedsByRoom: Record<string, MockEntrySeed[]> = {
    e5: [
        {
            id: '1',
            title: 'Programowanie\nsieciowe 1',
            weekOffset: 0,
            dayOffset: 0,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'lecture'
        },
        {
            id: '2',
            title: 'Matematyka\ndyskretna',
            weekOffset: 0,
            dayOffset: 2,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'exercise'
        },
        {
            id: '3',
            title: 'Architektura\noprogramowania',
            weekOffset: 1,
            dayOffset: 1,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'lecture'
        },
        {
            id: '4',
            title: 'Seminarium\ndyplomowe',
            weekOffset: -1,
            dayOffset: 4,
            startTime: '14:15',
            endTime: '15:45',
            variant: 'seminar'
        },
    ],
    l2: [
        {
            id: '1',
            title: 'Programowanie\nsieciowe 1',
            weekOffset: 0,
            dayOffset: 1,
            startTime: '11:15',
            endTime: '12:45',
            variant: 'lab'
        },
        {
            id: '2',
            title: 'Systemy\nrozproszone',
            weekOffset: 1,
            dayOffset: 1,
            startTime: '09:15',
            endTime: '10:45',
            variant: 'lab'
        },
        {
            id: '3',
            title: 'Inżynieria\noprogramowania',
            weekOffset: 0,
            dayOffset: 3,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'project'
        },
        {
            id: '4',
            title: 'Podstawy\nkonteneryzacji',
            weekOffset: -1,
            dayOffset: 2,
            startTime: '15:15',
            endTime: '16:45',
            variant: 'lab'
        },
    ],
    '204': [
        {
            id: '1',
            title: 'Projektowanie\ninterfejsów aplikacji\nWWW',
            weekOffset: 0,
            dayOffset: 1,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'project'
        },
        {
            id: '2',
            title: 'Analiza\ndanych',
            weekOffset: 0,
            dayOffset: 4,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'lecture'
        },
        {
            id: '3',
            title: 'Bazy\ndanych',
            weekOffset: 1,
            dayOffset: 2,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'exercise'
        },
        {
            id: '4',
            title: 'Uczenie\nmaszynowe',
            weekOffset: -1,
            dayOffset: 0,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'lecture'
        },
    ],
    f3: [
        {
            id: '1',
            title: 'Sieci\nkomputerowe',
            weekOffset: 0,
            dayOffset: 0,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'lab'
        },
        {
            id: '2',
            title: 'Systemy\noperacyjne',
            weekOffset: 0,
            dayOffset: 2,
            startTime: '14:15',
            endTime: '15:45',
            variant: 'exercise'
        },
        {
            id: '3',
            title: 'Testowanie\noprogramowania',
            weekOffset: 1,
            dayOffset: 3,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'lab'
        },
    ],
};

const roomScheduleSeedsByBuilding: Record<string, MockEntrySeed[]> = {
    a11: [
        {
            id: '1',
            title: 'Algebra\nliniowa',
            weekOffset: 0,
            dayOffset: 1,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'lecture'
        },
        {
            id: '2',
            title: 'Metody\nnumeryczne',
            weekOffset: 0,
            dayOffset: 3,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'exercise'
        },
        {
            id: '3',
            title: 'Warsztaty\nprojektowe',
            weekOffset: 1,
            dayOffset: 4,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'project'
        },
    ],
    b2: [
        {
            id: '1',
            title: 'Grafika\nkomputerowa',
            weekOffset: 0,
            dayOffset: 2,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'lab'
        },
        {
            id: '2',
            title: 'Bazy\ndanych',
            weekOffset: 1,
            dayOffset: 0,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'lecture'
        },
    ],
};

const roomScheduleSeedsByCampus: Record<string, MockEntrySeed[]> = {
    a: [
        {
            id: '1',
            title: 'Konsultacje\nwydziałowe',
            weekOffset: 0,
            dayOffset: 4,
            startTime: '14:15',
            endTime: '15:45',
            variant: 'seminar'
        },
        {
            id: '2',
            title: 'Spotkanie\nkoła naukowego',
            weekOffset: 1,
            dayOffset: 2,
            startTime: '16:15',
            endTime: '17:45',
            variant: 'seminar'
        },
    ],
    b: [
        {
            id: '1',
            title: 'Zajęcia\nwyrównawcze',
            weekOffset: 0,
            dayOffset: 0,
            startTime: '16:15',
            endTime: '17:45',
            variant: 'exercise'
        },
        {
            id: '2',
            title: 'Laboratorium\nprojektowe',
            weekOffset: -1,
            dayOffset: 3,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'lab'
        },
    ],
};

const createFallbackRoomEntries = ({campusId, buildingId, roomId}: RoomScheduleParams): ScheduleEntry[] => {
    const roomLabel = humanizeRoomId(roomId);

    return mapSeedsToEntries(`${campusId}-${buildingId}-${roomId}`, [
        {
            id: 'fallback-1',
            title: `Seminarium\nsala ${roomLabel}`,
            weekOffset: 0,
            dayOffset: 1,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'seminar'
        },
        {
            id: 'fallback-2',
            title: `Ćwiczenia\nsala ${roomLabel}`,
            weekOffset: 0,
            dayOffset: 3,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'exercise'
        },
        {
            id: 'fallback-3',
            title: `Projekt\n${buildingId.toUpperCase()}`,
            weekOffset: 1,
            dayOffset: 2,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'project'
        },
    ]);
};

export const roomScheduleMock: Record<string, ScheduleEntry[]> = Object.fromEntries(
    Object.entries(roomScheduleSeedsByRoom).map(([roomId, seeds]) => [roomId, mapSeedsToEntries(roomId, seeds)]),
);

export function getMockRoomScheduleEntries({
                                               campusId,
                                               buildingId,
                                               roomId,
                                           }: RoomScheduleParams): ScheduleEntry[] {
    const exactRoomEntries = roomScheduleSeedsByRoom[roomId];
    if (exactRoomEntries) return mapSeedsToEntries(roomId, exactRoomEntries);

    const buildingEntries = roomScheduleSeedsByBuilding[buildingId];
    if (buildingEntries) return mapSeedsToEntries(`${buildingId}-${roomId}`, buildingEntries);

    const campusEntries = roomScheduleSeedsByCampus[campusId];
    if (campusEntries) return mapSeedsToEntries(`${campusId}-${buildingId}-${roomId}`, campusEntries);

    return createFallbackRoomEntries({campusId, buildingId, roomId});
}