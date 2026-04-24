import type {ScheduleEntry} from '@api';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';

export interface LecturerDepartmentItem {
    id: string;
    name: string;
}

export interface LecturerItem {
    id: string;
    departmentId: string;
    firstName: string;
    lastName: string;
    title: string;
}

interface LecturerScheduleParams {
    departmentId: string;
    lecturerId: string;
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

export const lecturerDepartmentsMock: LecturerDepartmentItem[] = [
    {id: 'wii', name: 'Wydział Informatyki i Inteligentnych Systemów'},
    {id: 'wm', name: 'Wydział Matematyki'},
    {id: 'centrum-jezykow', name: 'Centrum Języków Obcych'},
    {id: 'cku', name: 'Centrum Kształcenia Ustawicznego'},
];

export const lecturersMock: LecturerItem[] = [
    {
        id: 'wajman-radoslaw',
        departmentId: 'wii',
        firstName: 'Radosław',
        lastName: 'Wajman',
        title: 'dr hab. inż.',
    },
    {
        id: 'kowalska-anna',
        departmentId: 'wii',
        firstName: 'Anna',
        lastName: 'Kowalska',
        title: 'mgr inż.',
    },
    {
        id: 'zielinski-tomasz',
        departmentId: 'wii',
        firstName: 'Tomasz',
        lastName: 'Zieliński',
        title: 'dr inż.',
    },
    {
        id: 'nowak-michal',
        departmentId: 'wm',
        firstName: 'Michał',
        lastName: 'Nowak',
        title: 'dr inż.',
    },
    {
        id: 'malinowska-ewa',
        departmentId: 'centrum-jezykow',
        firstName: 'Ewa',
        lastName: 'Malinowska',
        title: 'mgr',
    },
];

const lecturerScheduleSeedsByLecturer: Record<string, MockEntrySeed[]> = {
    'wajman-radoslaw': [
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
            title: 'Programowanie\nsieciowe 1',
            weekOffset: 0,
            dayOffset: 2,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'lab',
        },
        {
            id: '3',
            title: 'Seminarium\ninżynierskie',
            weekOffset: 1,
            dayOffset: 3,
            startTime: '14:15',
            endTime: '15:45',
            variant: 'seminar',
        },
        {
            id: '4',
            title: 'Konsultacje',
            weekOffset: -1,
            dayOffset: 4,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'exercise',
        },
    ],
    'kowalska-anna': [
        {
            id: '1',
            title: 'Projektowanie\ninterfejsów aplikacji\nWWW',
            weekOffset: 0,
            dayOffset: 1,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'project',
        },
        {
            id: '2',
            title: 'UX i prototypowanie',
            weekOffset: 0,
            dayOffset: 3,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'exercise',
        },
        {
            id: '3',
            title: 'Warsztaty\nprojektowe',
            weekOffset: 1,
            dayOffset: 1,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'project',
        },
    ],
    'zielinski-tomasz': [
        {
            id: '1',
            title: 'Systemy\nrozproszone',
            weekOffset: 0,
            dayOffset: 1,
            startTime: '11:15',
            endTime: '12:45',
            variant: 'lab',
        },
        {
            id: '2',
            title: 'Architektura\noprogramowania',
            weekOffset: 0,
            dayOffset: 4,
            startTime: '09:15',
            endTime: '10:45',
            variant: 'lecture',
        },
        {
            id: '3',
            title: 'Projekt\nzespołowy',
            weekOffset: -1,
            dayOffset: 2,
            startTime: '14:15',
            endTime: '15:45',
            variant: 'project',
        },
    ],
    'nowak-michal': [
        {
            id: '1',
            title: 'Matematyka\ndyskretna',
            weekOffset: 0,
            dayOffset: 2,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'exercise',
        },
        {
            id: '2',
            title: 'Algebra\nliniowa',
            weekOffset: 1,
            dayOffset: 0,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'lecture',
        },
    ],
};

const lecturerScheduleSeedsByDepartment: Record<string, MockEntrySeed[]> = {
    wii: [
        {
            id: '1',
            title: 'Konsultacje\nwydziałowe',
            weekOffset: 0,
            dayOffset: 4,
            startTime: '14:15',
            endTime: '15:45',
            variant: 'seminar',
        },
        {
            id: '2',
            title: 'Dyżur\nprowadzącego',
            weekOffset: 1,
            dayOffset: 2,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'exercise',
        },
    ],
    wm: [
        {
            id: '1',
            title: 'Ćwiczenia\nmatematyczne',
            weekOffset: 0,
            dayOffset: 1,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'exercise',
        },
        {
            id: '2',
            title: 'Seminarium\nwydziałowe',
            weekOffset: 1,
            dayOffset: 3,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'seminar',
        },
    ],
};

const createFallbackLecturerEntries = ({departmentId, lecturerId}: LecturerScheduleParams): ScheduleEntry[] => {
    return mapSeedsToEntries(`${departmentId}-${lecturerId}`, [
        {
            id: 'fallback-1',
            title: 'Wykład\nkursowy',
            weekOffset: 0,
            dayOffset: 0,
            startTime: '10:15',
            endTime: '11:45',
            variant: 'lecture',
        },
        {
            id: 'fallback-2',
            title: 'Ćwiczenia',
            weekOffset: 0,
            dayOffset: 2,
            startTime: '12:15',
            endTime: '13:45',
            variant: 'exercise',
        },
        {
            id: 'fallback-3',
            title: 'Konsultacje',
            weekOffset: 1,
            dayOffset: 4,
            startTime: '08:15',
            endTime: '09:45',
            variant: 'seminar',
        },
    ]);
};

export function getMockLecturerScheduleEntries({
                                                   departmentId,
                                                   lecturerId,
                                               }: LecturerScheduleParams): ScheduleEntry[] {
    const exactEntries = lecturerScheduleSeedsByLecturer[lecturerId];
    if (exactEntries) {
        return mapSeedsToEntries(lecturerId, exactEntries);
    }

    const departmentEntries = lecturerScheduleSeedsByDepartment[departmentId];
    if (departmentEntries) {
        return mapSeedsToEntries(`${departmentId}-${lecturerId}`, departmentEntries);
    }

    return createFallbackLecturerEntries({departmentId, lecturerId});
}