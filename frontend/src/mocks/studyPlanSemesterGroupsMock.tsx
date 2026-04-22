import type {StudyPlanGroupSummary} from '@api/types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_STUDY_PLAN_GROUPS: Record<string, StudyPlanGroupSummary[]> = {
    '1-1': [
        {id: 101, group_name: 'Grupa 1', group_code: 'P1'},
        {id: 102, group_name: 'Grupa 2', group_code: 'P2'},
        {id: 103, group_name: 'Grupa 3', group_code: 'P3'},
    ],
    '1-2': [
        {id: 201, group_name: 'Grupa 1', group_code: 'P1'},
        {id: 202, group_name: 'Grupa 2', group_code: 'P2'},
    ],
    '1-5': [
        {id: 501, group_name: 'Grupa 1', group_code: 'I1'},
        {id: 502, group_name: 'Grupa 2', group_code: 'I2'},
        {id: 503, group_name: 'Grupa 3', group_code: 'I3'},
        {id: 504, group_name: 'Grupa 4', group_code: 'I4'},
    ],
    '2-3': [
        {id: 301, group_name: 'Grupa A', group_code: 'A1'},
        {id: 302, group_name: 'Grupa B', group_code: 'B1'},
    ],
};

export const fetchMockStudyPlanGroups = async (
    fieldOfStudyId: number,
    semesterNumber: number,
): Promise<StudyPlanGroupSummary[]> => {
    await sleep(300);

    return MOCK_STUDY_PLAN_GROUPS[`${fieldOfStudyId}-${semesterNumber}`] ?? [
        {id: 9001, group_name: 'Grupa 1', group_code: 'G1'},
        {id: 9002, group_name: 'Grupa 2', group_code: 'G2'},
        {id: 9003, group_name: 'Grupa 3', group_code: 'G3'},
    ];
};