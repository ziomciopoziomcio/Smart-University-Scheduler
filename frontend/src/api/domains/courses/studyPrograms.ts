import {type PaginatedResponse, COURSES_URL, getHeaders} from "@api/core";
import type {StudyProgramDetails} from "./types";

export const fetchStudyPrograms = async (
    limit = 100,
    offset = 0,
    studyFieldId?: number
): Promise<PaginatedResponse<StudyProgramDetails>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
    if (studyFieldId) params.append('study_field', studyFieldId.toString());

    const response = await fetch(`${COURSES_URL}/study-programs?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kierunków studiów');
    return response.json();
};