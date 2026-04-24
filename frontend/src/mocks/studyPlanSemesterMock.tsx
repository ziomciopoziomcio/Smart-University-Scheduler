import type {StudyFieldSemesterSummary} from '@api';

const MOCK_SEMESTERS_BY_FIELD_ID: Record<number, StudyFieldSemesterSummary[]> = {
    1: [
        {semester_number: 1, groups_count: 13, major_count: null, elective_blocks_count: null},
        {semester_number: 2, groups_count: 11, major_count: null, elective_blocks_count: null},
        {semester_number: 3, groups_count: 11, major_count: null, elective_blocks_count: null},
        {semester_number: 4, groups_count: 10, major_count: null, elective_blocks_count: null},
        {semester_number: 5, groups_count: 9, major_count: 4, elective_blocks_count: null},
        {semester_number: 6, groups_count: 9, major_count: 4, elective_blocks_count: null},
        {semester_number: 7, groups_count: 8, major_count: 4, elective_blocks_count: 2},
    ],
    2: [
        {semester_number: 1, groups_count: 8, major_count: null, elective_blocks_count: null},
        {semester_number: 2, groups_count: 8, major_count: null, elective_blocks_count: null},
        {semester_number: 3, groups_count: 7, major_count: null, elective_blocks_count: null},
        {semester_number: 4, groups_count: 7, major_count: null, elective_blocks_count: null},
        {semester_number: 5, groups_count: 6, major_count: null, elective_blocks_count: 2},
        {semester_number: 6, groups_count: 6, major_count: null, elective_blocks_count: 2},
        {semester_number: 7, groups_count: 5, major_count: 3, elective_blocks_count: 2},
    ],
    3: [
        {semester_number: 1, groups_count: 5, major_count: null, elective_blocks_count: null},
        {semester_number: 2, groups_count: 5, major_count: null, elective_blocks_count: null},
        {semester_number: 3, groups_count: 4, major_count: null, elective_blocks_count: null},
    ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchMockStudyFieldSemesters = async (
    studyFieldId: number,
): Promise<StudyFieldSemesterSummary[]> => {
    await sleep(350);

    return MOCK_SEMESTERS_BY_FIELD_ID[studyFieldId] ?? [
        {semester_number: 1, groups_count: 12, major_count: null, elective_blocks_count: null},
        {semester_number: 2, groups_count: 10, major_count: null, elective_blocks_count: null},
        {semester_number: 3, groups_count: 10, major_count: null, elective_blocks_count: null},
        {semester_number: 4, groups_count: 9, major_count: null, elective_blocks_count: null},
        {semester_number: 5, groups_count: 8, major_count: 2, elective_blocks_count: null},
        {semester_number: 6, groups_count: 8, major_count: 2, elective_blocks_count: 2},
    ];
};