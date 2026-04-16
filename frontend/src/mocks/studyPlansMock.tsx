import type {ScheduleEntry} from '@api/types';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';

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

interface StudyPlanScheduleParams {
    curriculumYearId: string;
    fieldOfStudyId: string;
    semesterId: string;
    specializationId: string | null;
    electiveBlockId: string | null;
}

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

const mapSeedsToEntries = (prefix: string, seeds: MockEntrySeed[]): ScheduleEntry[] => {
    return seeds.map((seed) => ({
        id: `${prefix}-${seed.id}`,
        title: seed.title,
        date: createIsoDate(seed.weekOffset, seed.dayOffset),
        startHour: seed.startHour,
        endHour: seed.endHour,
        variant: seed.variant,
    }));
};

const humanizeIdentifier = (value: string | null) => {
    if (!value) return '';
    return value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

export const curriculumYearsMock: CurriculumYearItem[] = [
    {id: '2021', name: '2021/2022'},
    {id: '2022', name: '2022/2023'},
    {id: '2023', name: '2023/2024'},
];

export const fieldsOfStudyMock: FieldOfStudyItem[] = [
    {id: 'informatics', curriculumYearId: '2021', name: 'Informatyka'},
    {id: 'informatics', curriculumYearId: '2022', name: 'Informatyka'},
    {id: 'informatics', curriculumYearId: '2023', name: 'Informatyka'},
    {id: 'data-science', curriculumYearId: '2023', name: 'Data Science'},
];

export const semestersMock: SemesterItem[] = [
    {
        id: '4',
        curriculumYearId: '2022',
        fieldOfStudyId: 'informatics',
        name: 'Semestr 4',
        hasSpecializations: false,
        hasElectiveBlocks: false,
    },
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
        id: '2',
        curriculumYearId: '2023',
        fieldOfStudyId: 'data-science',
        name: 'Semestr 2',
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

export function buildStudyPlanKey({
                                      curriculumYearId,
                                      fieldOfStudyId,
                                      semesterId,
                                      specializationId,
                                      electiveBlockId,
                                  }: StudyPlanScheduleParams) {
    return `${curriculumYearId}|${fieldOfStudyId}|${semesterId}|${specializationId ?? 'null'}|${electiveBlockId ?? 'null'}`;
}

const studyPlanScheduleSeedsByKey: Record<string, MockEntrySeed[]> = {
    '2021|informatics|6|software-engineering|null': [
        {
            id: '1',
            title: 'Programowanie\nsieciowe 1',
            weekOffset: 0,
            dayOffset: 0,
            startHour: 10,
            endHour: 12,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Projektowanie\nobiektowe',
            weekOffset: 0,
            dayOffset: 2,
            startHour: 12,
            endHour: 14,
            variant: 'exercise',
        },
        {
            id: '3',
            title: 'Inżynieria\nwymagań',
            weekOffset: 1,
            dayOffset: 1,
            startHour: 8,
            endHour: 10,
            variant: 'project',
        },
        {
            id: '4',
            title: 'Seminarium\ninżynierskie',
            weekOffset: -1,
            dayOffset: 4,
            startHour: 14,
            endHour: 16,
            variant: 'seminar',
        },
    ],
    '2021|informatics|7|software-engineering|block-a': [
        {
            id: '1',
            title: 'Architektura\noprogramowania',
            weekOffset: 0,
            dayOffset: 1,
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Systemy\nrozproszone',
            weekOffset: 0,
            dayOffset: 3,
            startHour: 10,
            endHour: 12,
            variant: 'lab',
        },
        {
            id: '3',
            title: 'Testowanie\nautomatyczne',
            weekOffset: 1,
            dayOffset: 2,
            startHour: 12,
            endHour: 14,
            variant: 'project',
        },
    ],
    '2021|informatics|7|data-science|block-b': [
        {
            id: '1',
            title: 'Uczenie\nmaszynowe',
            weekOffset: 0,
            dayOffset: 1,
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Analiza\ndanych',
            weekOffset: 0,
            dayOffset: 4,
            startHour: 10,
            endHour: 12,
            variant: 'lab',
        },
        {
            id: '3',
            title: 'Eksploracja\ndanych',
            weekOffset: 1,
            dayOffset: 0,
            startHour: 12,
            endHour: 14,
            variant: 'exercise',
        },
    ],
    '2022|informatics|4|null|null': [
        {
            id: '1',
            title: 'Algorytmy i\nstruktury danych',
            weekOffset: 0,
            dayOffset: 0,
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Systemy\noperacyjne',
            weekOffset: 0,
            dayOffset: 2,
            startHour: 10,
            endHour: 12,
            variant: 'lab',
        },
        {
            id: '3',
            title: 'Bazy\ndanych',
            weekOffset: 1,
            dayOffset: 3,
            startHour: 8,
            endHour: 10,
            variant: 'exercise',
        },
    ],
};

const studyPlanScheduleSeedsBySpecialization: Record<string, MockEntrySeed[]> = {
    'software-engineering': [
        {
            id: '1',
            title: 'Wzorce\nprojektowe',
            weekOffset: 0,
            dayOffset: 1,
            startHour: 12,
            endHour: 14,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Testowanie\noprogramowania',
            weekOffset: 1,
            dayOffset: 3,
            startHour: 8,
            endHour: 10,
            variant: 'lab',
        },
        {
            id: '3',
            title: 'Projekt\nzespołowy',
            weekOffset: -1,
            dayOffset: 2,
            startHour: 14,
            endHour: 16,
            variant: 'project',
        },
    ],
    'data-science': [
        {
            id: '1',
            title: 'Statystyka\nstosowana',
            weekOffset: 0,
            dayOffset: 0,
            startHour: 10,
            endHour: 12,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Wizualizacja\ndanych',
            weekOffset: 0,
            dayOffset: 3,
            startHour: 12,
            endHour: 14,
            variant: 'project',
        },
    ],
};

const studyPlanScheduleSeedsBySemester: Record<string, MockEntrySeed[]> = {
    '6': [
        {
            id: '1',
            title: 'Sieci\nkomputerowe',
            weekOffset: 0,
            dayOffset: 0,
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Programowanie\nwspółbieżne',
            weekOffset: 0,
            dayOffset: 2,
            startHour: 10,
            endHour: 12,
            variant: 'lab',
        },
        {
            id: '3',
            title: 'Aplikacje\ninternetowe',
            weekOffset: 1,
            dayOffset: 1,
            startHour: 12,
            endHour: 14,
            variant: 'project',
        },
    ],
    '7': [
        {
            id: '1',
            title: 'Bezpieczeństwo\naplikacji',
            weekOffset: 0,
            dayOffset: 1,
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Praca\nzespołowa',
            weekOffset: 0,
            dayOffset: 4,
            startHour: 10,
            endHour: 12,
            variant: 'seminar',
        },
    ],
};

const studyPlanScheduleSeedsByField: Record<string, MockEntrySeed[]> = {
    informatics: [
        {
            id: '1',
            title: 'Matematyka\ndyskretna',
            weekOffset: 0,
            dayOffset: 0,
            startHour: 12,
            endHour: 14,
            variant: 'exercise',
        },
        {
            id: '2',
            title: 'Architektura\nkomputerów',
            weekOffset: 1,
            dayOffset: 2,
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
    ],
    'data-science': [
        {
            id: '1',
            title: 'Rachunek\nprawdopodobieństwa',
            weekOffset: 0,
            dayOffset: 2,
            startHour: 8,
            endHour: 10,
            variant: 'lecture',
        },
        {
            id: '2',
            title: 'Przetwarzanie\ndanych',
            weekOffset: 1,
            dayOffset: 1,
            startHour: 10,
            endHour: 12,
            variant: 'lab',
        },
    ],
};

const createFallbackStudyPlanEntries = ({
                                            curriculumYearId,
                                            fieldOfStudyId,
                                            semesterId,
                                            specializationId,
                                            electiveBlockId,
                                        }: StudyPlanScheduleParams): ScheduleEntry[] => {
    const fieldLabel = humanizeIdentifier(fieldOfStudyId);
    const specializationLabel = humanizeIdentifier(specializationId);
    const electiveLabel = humanizeIdentifier(electiveBlockId);

    return mapSeedsToEntries(
        buildStudyPlanKey({
            curriculumYearId,
            fieldOfStudyId,
            semesterId,
            specializationId,
            electiveBlockId,
        }),
        [
            {
                id: 'fallback-1',
                title: `${fieldLabel}\nSemestr ${semesterId}`,
                weekOffset: 0,
                dayOffset: 1,
                startHour: 10,
                endHour: 12,
                variant: 'lecture',
            },
            {
                id: 'fallback-2',
                title: specializationLabel
                    ? `${specializationLabel}\npracownia`
                    : 'Pracownia\nkierunkowa',
                weekOffset: 0,
                dayOffset: 3,
                startHour: 12,
                endHour: 14,
                variant: 'lab',
            },
            {
                id: 'fallback-3',
                title: electiveLabel
                    ? `${electiveLabel}\nprojekt`
                    : `Rocznik ${curriculumYearId}\nprojekt`,
                weekOffset: 1,
                dayOffset: 2,
                startHour: 8,
                endHour: 10,
                variant: 'project',
            },
        ],
    );
};

export const studyPlanScheduleMock: Record<string, ScheduleEntry[]> = Object.fromEntries(
    Object.entries(studyPlanScheduleSeedsByKey).map(([key, seeds]) => [key, mapSeedsToEntries(key, seeds)]),
);

export function getMockStudyPlanScheduleEntries(params: StudyPlanScheduleParams): ScheduleEntry[] {
    const key = buildStudyPlanKey(params);

    const exactKeyEntries = studyPlanScheduleSeedsByKey[key];
    if (exactKeyEntries) {
        return mapSeedsToEntries(key, exactKeyEntries);
    }

    if (params.specializationId && studyPlanScheduleSeedsBySpecialization[params.specializationId]) {
        return mapSeedsToEntries(key, studyPlanScheduleSeedsBySpecialization[params.specializationId]);
    }

    if (studyPlanScheduleSeedsBySemester[params.semesterId]) {
        return mapSeedsToEntries(key, studyPlanScheduleSeedsBySemester[params.semesterId]);
    }

    if (studyPlanScheduleSeedsByField[params.fieldOfStudyId]) {
        return mapSeedsToEntries(key, studyPlanScheduleSeedsByField[params.fieldOfStudyId]);
    }

    return createFallbackStudyPlanEntries(params);
}