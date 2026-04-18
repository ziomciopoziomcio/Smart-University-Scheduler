import {useAuthStore} from '@store/useAuthStore';
import type {PaginatedResponse, StudyProgramDetails, MajorDetails} from './types';

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const COURSE_URL = (baseApiUrl ? `${baseApiUrl}/course` : 'http://localhost:3000/course').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

export const fetchStudyPrograms = async (
    limit: number = 200,
    offset: number = 0,
    studyFieldId?: number
): Promise<PaginatedResponse<StudyProgramDetails>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
    if (studyFieldId) params.append('study_field', studyFieldId.toString());

    const response = await fetch(`${COURSE_URL}/study-programs?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać kierunków studiów');
    return response.json();
};

export const fetchMajors = async (
    limit: number = 200,
    offset: number = 0,
    studyFieldId?: number
): Promise<PaginatedResponse<MajorDetails>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
    if (studyFieldId) params.append('study_field', studyFieldId.toString());

    const response = await fetch(`${COURSE_URL}/majors?${params.toString()}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać specjalności');
    return response.json();
};