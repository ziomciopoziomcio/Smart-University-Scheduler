import {getHeaders, ACADEMICS_URL} from '@api/core';
import {type StudyFieldSemesterSummary} from './types.ts';

export const fetchStudyFieldSemesterSummary = async (
    studyFieldId: number,
): Promise<StudyFieldSemesterSummary[]> => {
    const response = await fetch(
        `${ACADEMICS_URL}/semesters/summary/by-study-field/${studyFieldId}`,
        {headers: getHeaders()},
    );

    if (!response.ok) {
        throw new Error('Failed to fetch study field semester summary');
    }

    return response.json();
};