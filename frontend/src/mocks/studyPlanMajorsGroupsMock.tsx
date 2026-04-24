import type {StudyPlanGroupSummary} from '@api';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_SPECIALIZATION_GROUPS: Record<number, StudyPlanGroupSummary[]> = {
    101: [
        {id: 1001, group_name: 'IO-1', group_code: 'IO-1'},
        {id: 1002, group_name: 'IO-2', group_code: 'IO-2'},
        {id: 1003, group_name: 'IO-3', group_code: 'IO-3'},
    ],
    102: [
        {id: 1101, group_name: 'EABD-1', group_code: 'EABD-1'},
        {id: 1102, group_name: 'EABD-2', group_code: 'EABD-2'},
    ],
    103: [
        {id: 1201, group_name: 'SS-1', group_code: 'SS-1'},
        {id: 1202, group_name: 'SS-2', group_code: 'SS-2'},
    ],
    104: [
        {id: 1301, group_name: 'TI-1', group_code: 'TI-1'},
        {id: 1302, group_name: 'TI-2', group_code: 'TI-2'},
    ],
    201: [
        {id: 2001, group_name: 'IO-1', group_code: 'IO-1'},
        {id: 2002, group_name: 'IO-2', group_code: 'IO-2'},
        {id: 2003, group_name: 'IO-3', group_code: 'IO-3'},
    ],
    202: [
        {id: 2101, group_name: 'EABD-1', group_code: 'EABD-1'},
        {id: 2102, group_name: 'EABD-2', group_code: 'EABD-2'},
    ],
};

export async function fetchMockStudyPlanMajorGroups(
    specializationId: number,
): Promise<StudyPlanGroupSummary[]> {
    await sleep(300);

    return MOCK_SPECIALIZATION_GROUPS[specializationId] ?? [
        {id: 9001, group_name: 'Grupa 1', group_code: 'G1'},
        {id: 9002, group_name: 'Grupa 2', group_code: 'G2'},
    ];
}