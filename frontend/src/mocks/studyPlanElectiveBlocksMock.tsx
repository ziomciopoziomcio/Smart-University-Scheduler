import type {StudyPlanGroupSummary} from '@api';

export interface StudyPlanElectiveBlockSummary {
    id: number;
    name: string;
}

interface FetchBlocksParams {
    fieldOfStudyId: number;
    semesterId: number;
    specializationId?: number | null;
}

interface FetchBlockGroupsParams {
    fieldOfStudyId: number;
    semesterId: number;
    blockId: number;
    specializationId?: number | null;
}

const BLOCKS: Record<string, StudyPlanElectiveBlockSummary[]> = {
    '1-5-no-spec': [
        {id: 11, name: 'Blok obieralny A'},
        {id: 12, name: 'Blok obieralny B'},
        {id: 13, name: 'Blok obieralny C'},
    ],
    '1-6-no-spec': [
        {id: 21, name: 'Blok obieralny A'},
        {id: 22, name: 'Blok obieralny B'},
        {id: 23, name: 'Blok obieralny C'},
        {id: 24, name: 'Blok obieralny D'},
    ],

    '1-5-spec-101': [
        {id: 111, name: 'Blok IO A'},
        {id: 112, name: 'Blok IO B'},
    ],
    '1-5-spec-102': [
        {id: 121, name: 'Blok Data A'},
        {id: 122, name: 'Blok Data B'},
    ],
    '1-5-spec-103': [
        {id: 131, name: 'Blok Sieci A'},
        {id: 132, name: 'Blok Sieci B'},
    ],
    '1-5-spec-104': [
        {id: 141, name: 'Blok Web A'},
        {id: 142, name: 'Blok Web B'},
    ],

    '1-6-spec-201': [
        {id: 31, name: 'Blok AI'},
        {id: 32, name: 'Blok Web'},
        {id: 33, name: 'Blok Mobile'},
    ],
    '1-6-spec-202': [
        {id: 41, name: 'Blok Data'},
        {id: 42, name: 'Blok BI'},
    ],
};

const BLOCK_GROUPS: Record<string, StudyPlanGroupSummary[]> = {
    '1-5-block-11': [
        {id: 1011, group_name: 'Grupa 1', group_code: 'A-1'},
        {id: 1012, group_name: 'Grupa 2', group_code: 'A-2'},
    ],
    '1-5-block-12': [
        {id: 1021, group_name: 'Grupa 1', group_code: 'B-1'},
        {id: 1022, group_name: 'Grupa 2', group_code: 'B-2'},
    ],
    '1-5-block-13': [
        {id: 1031, group_name: 'Grupa 1', group_code: 'C-1'},
    ],

    '1-6-block-21': [
        {id: 2011, group_name: 'Grupa 1', group_code: 'A-1'},
        {id: 2012, group_name: 'Grupa 2', group_code: 'A-2'},
    ],
    '1-6-block-22': [
        {id: 2021, group_name: 'Grupa 1', group_code: 'B-1'},
    ],
    '1-6-block-23': [
        {id: 2031, group_name: 'Grupa 1', group_code: 'C-1'},
        {id: 2032, group_name: 'Grupa 2', group_code: 'C-2'},
    ],
    '1-6-block-24': [
        {id: 2041, group_name: 'Grupa 1', group_code: 'D-1'},
    ],

    '1-5-spec-101-block-111': [
        {id: 1111, group_name: 'Grupa 1', group_code: 'IO-A1'},
        {id: 1112, group_name: 'Grupa 2', group_code: 'IO-A2'},
    ],
    '1-5-spec-101-block-112': [
        {id: 1121, group_name: 'Grupa 1', group_code: 'IO-B1'},
    ],

    '1-5-spec-102-block-121': [
        {id: 1211, group_name: 'Grupa 1', group_code: 'DATA-A1'},
    ],
    '1-5-spec-102-block-122': [
        {id: 1221, group_name: 'Grupa 1', group_code: 'DATA-B1'},
        {id: 1222, group_name: 'Grupa 2', group_code: 'DATA-B2'},
    ],

    '1-5-spec-103-block-131': [
        {id: 1311, group_name: 'Grupa 1', group_code: 'NET-A1'},
    ],
    '1-5-spec-103-block-132': [
        {id: 1321, group_name: 'Grupa 1', group_code: 'NET-B1'},
    ],

    '1-5-spec-104-block-141': [
        {id: 1411, group_name: 'Grupa 1', group_code: 'WEB-A1'},
    ],
    '1-5-spec-104-block-142': [
        {id: 1421, group_name: 'Grupa 1', group_code: 'WEB-B1'},
        {id: 1422, group_name: 'Grupa 2', group_code: 'WEB-B2'},
    ],

    '1-6-spec-201-block-31': [
        {id: 3011, group_name: 'Grupa 1', group_code: 'AI-1'},
        {id: 3012, group_name: 'Grupa 2', group_code: 'AI-2'},
    ],
    '1-6-spec-201-block-32': [
        {id: 3021, group_name: 'Grupa 1', group_code: 'WEB-1'},
    ],
    '1-6-spec-201-block-33': [
        {id: 3031, group_name: 'Grupa 1', group_code: 'MOB-1'},
    ],

    '1-6-spec-202-block-41': [
        {id: 4011, group_name: 'Grupa 1', group_code: 'DATA-1'},
    ],
    '1-6-spec-202-block-42': [
        {id: 4021, group_name: 'Grupa 1', group_code: 'BI-1'},
        {id: 4022, group_name: 'Grupa 2', group_code: 'BI-2'},
    ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchMockStudyPlanElectiveBlocks(
    params: FetchBlocksParams,
): Promise<StudyPlanElectiveBlockSummary[]> {
    await sleep(250);

    const key = params.specializationId
        ? `${params.fieldOfStudyId}-${params.semesterId}-spec-${params.specializationId}`
        : `${params.fieldOfStudyId}-${params.semesterId}-no-spec`;

    return BLOCKS[key] ?? [];
}

export async function fetchMockStudyPlanElectiveBlockGroups(
    params: FetchBlockGroupsParams,
): Promise<StudyPlanGroupSummary[]> {
    await sleep(250);

    const key = params.specializationId
        ? `${params.fieldOfStudyId}-${params.semesterId}-spec-${params.specializationId}-block-${params.blockId}`
        : `${params.fieldOfStudyId}-${params.semesterId}-block-${params.blockId}`;

    return BLOCK_GROUPS[key] ?? [];
}