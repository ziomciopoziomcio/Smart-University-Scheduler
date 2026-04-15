import type {ScheduleEntry} from '@api/types';

export interface CurriculumYearItem {
    id: string;
    name: string;
}

export interface FieldOfStudyItem {
    id: string;
    curriculumYearId: string;
    name: string;
}

export interface SemesterItem {
    id: string;
    curriculumYearId: string;
    fieldOfStudyId: string;
    name: string;
    hasSpecializations: boolean;
    hasElectiveBlocks: boolean;
}

export interface SpecializationItem {
    id: string;
    curriculumYearId: string;
    fieldOfStudyId: string;
    semesterId: string;
    name: string;
}

export interface ElectiveBlockItem {
    id: string;
    curriculumYearId: string;
    fieldOfStudyId: string;
    semesterId: string;
    specializationId: string | null;
    name: string;
}

export const curriculumYearsMock: CurriculumYearItem[] = [
    {id: '2021', name: '2021/2022'},
    {id: '2022', name: '2022/2023'},
];

export const fieldsOfStudyMock: FieldOfStudyItem[] = [
    {id: 'informatics', curriculumYearId: '2021', name: 'Informatyka'},
    {id: 'informatics', curriculumYearId: '2022', name: 'Informatyka'},
];

export const semestersMock: SemesterItem[] = [
    {
        id: '6',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        name: 'Semestr 6',
        hasSpecializations: true,
        hasElectiveBlocks: false,
    },
    {
        id: '7',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        name: 'Semestr 7',
        hasSpecializations: true,
        hasElectiveBlocks: true,
    },
    {
        id: '4',
        curriculumYearId: '2022',
        fieldOfStudyId: 'informatics',
        name: 'Semestr 4',
        hasSpecializations: false,
        hasElectiveBlocks: false,
    },
];

export const specializationsMock: SpecializationItem[] = [
    {
        id: 'software-engineering',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        semesterId: '6',
        name: 'Inżynieria oprogramowania',
    },
    {
        id: 'software-engineering',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        semesterId: '7',
        name: 'Inżynieria oprogramowania',
    },
    {
        id: 'data-science',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        semesterId: '7',
        name: 'Data Science',
    },
];

export const electiveBlocksMock: ElectiveBlockItem[] = [
    {
        id: 'block-a',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        semesterId: '7',
        specializationId: 'software-engineering',
        name: 'Blok obieralny A',
    },
    {
        id: 'block-b',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        semesterId: '7',
        specializationId: 'data-science',
        name: 'Blok obieralny B',
    },
    {
        id: 'block-common',
        curriculumYearId: '2021',
        fieldOfStudyId: 'informatics',
        semesterId: '7',
        specializationId: null,
        name: 'Blok wspólny',
    },
];

export const studyPlanScheduleMock: Record<string, ScheduleEntry[]> = {
    '2021|informatics|6|software-engineering|null': [
        {
            id: 'sp1',
            title: 'Programowanie\nsieciowe 1',
            date: '2026-04-13',
            startHour: 10,
            endHour: 12,
            variant: 'lecture',
        },
        {
            id: 'sp2',
            title: 'Projektowanie\nobiektowe',
            date: '2026-04-15',
            startHour: 12,
            endHour: 14,
            variant: 'exercise',
        },
    ],
    '2021|informatics|7|software-engineering|block-a': [
        {
            id: 'sp3',
            title: 'Architektura\noprogramowania',
            date: '2026-04-14',
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
        {
            id: 'sp4',
            title: 'Systemy\nrozproszone',
            date: '2026-04-16',
            startHour: 10,
            endHour: 12,
            variant: 'lab',
        },
    ],
    '2021|informatics|7|data-science|block-b': [
        {
            id: 'sp5',
            title: 'Uczenie\nmaszynowe',
            date: '2026-04-14',
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
    ],
    '2022|informatics|4|null|null': [
        {
            id: 'sp6',
            title: 'Algorytmy i\nstruktury danych',
            date: '2026-04-13',
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
    ],
};