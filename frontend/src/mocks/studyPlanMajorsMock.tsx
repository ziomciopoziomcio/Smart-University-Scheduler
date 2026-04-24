export interface StudyPlanSpecializationSummary {
    id: number;
    name: string;
    groups_count: number;
    elective_blocks_count?: number | null;
}

interface GetMockStudyPlanSpecializationsParams {
    fieldOfStudyId: number;
    semesterId: number;
}

const MOCK_SPECIALIZATIONS: Record<string, StudyPlanSpecializationSummary[]> = {
    '1-5': [
        {
            id: 101,
            name: 'Inżynieria Oprogramowania',
            groups_count: 3,
            elective_blocks_count: 0,
        },
        {
            id: 102,
            name: 'Eksploracja, Analiza i Bazy Danych',
            groups_count: 2,
            elective_blocks_count: 0,
        },
        {
            id: 103,
            name: 'Systemy Sieciowe',
            groups_count: 2,
            elective_blocks_count: 0,
        },
        {
            id: 104,
            name: 'Technologie Internetowe',
            groups_count: 2,
            elective_blocks_count: 0,
        },
    ],
    '1-6': [
        {
            id: 201,
            name: 'Inżynieria Oprogramowania',
            groups_count: 3,
            elective_blocks_count: 2,
        },
        {
            id: 202,
            name: 'Eksploracja, Analiza i Bazy Danych',
            groups_count: 2,
            elective_blocks_count: 1,
        },
        {
            id: 203,
            name: 'Systemy Sieciowe',
            groups_count: 2,
            elective_blocks_count: 0,
        },
        {
            id: 204,
            name: 'Technologie Internetowe',
            groups_count: 2,
            elective_blocks_count: 1,
        },
    ],
    '2-5': [
        {
            id: 301,
            name: 'Aplikacje Mobilne',
            groups_count: 2,
            elective_blocks_count: 1,
        },
        {
            id: 302,
            name: 'Systemy Wbudowane',
            groups_count: 2,
            elective_blocks_count: 0,
        },
        {
            id: 303,
            name: 'Grafika Komputerowa',
            groups_count: 1,
            elective_blocks_count: 1,
        },
    ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchMockStudyPlanSpecializations(
    params: GetMockStudyPlanSpecializationsParams,
): Promise<StudyPlanSpecializationSummary[]> {
    const {fieldOfStudyId, semesterId} = params;

    await sleep(400);

    return (
        MOCK_SPECIALIZATIONS[`${fieldOfStudyId}-${semesterId}`] ?? [
            {
                id: 9991,
                name: 'Specjalizacja 1',
                groups_count: 2,
                elective_blocks_count: 0,
            },
            {
                id: 9992,
                name: 'Specjalizacja 2',
                groups_count: 2,
                elective_blocks_count: 1,
            },
        ]
    );
}