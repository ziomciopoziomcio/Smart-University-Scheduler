import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from "@components/Common/SearchBar.tsx";

import {fetchFaculties} from '@api/facilities.ts';
import {getFaculty} from '@api/structures.ts';
import {fetchStudyFields, getStudyField} from '@api/courses.ts';
import type {Faculty, StudyField, StudyFieldSemesterSummary, StudyPlanGroupSummary} from '@api/types';

import {fetchMockStudyFieldSemesters} from '../../mocks/studyPlanSemesterMock';
import {
    fetchMockStudyPlanSpecializations,
    type StudyPlanSpecializationSummary
} from '../../mocks/studyPlanSpecializationsMock';
import {fetchMockStudyPlanGroups} from '../../mocks/studyPlanSemesterGroupsMock';
import {fetchMockStudyPlanSpecializationGroups} from '../../mocks/studyPlanSpecializationGroupsMock';

import PlansStudentFacultyView from '@components/Schedule/Views/ScheduleStudentFacultyView.tsx';
import PlansStudentFieldView from '@components/Schedule/Views/ScheduleStudentFIeldView.tsx';
import PlansStudentSemesterView from '@components/Schedule/Views/ScheduleStudentSemesterView.tsx';
import PlansStudentSpecializationView from '@components/Schedule/Views/ScheduleStudentSpecializationView.tsx';
import PlansStudentGroupView from '@components/Schedule/Views/ScheduleStudentGroupView.tsx';

interface PlansStudentsPageProps {
    view: 'faculties' | 'fields' | 'semesters' | 'specializations' | 'groups';
}

export default function StudentsSchedulesPage({view}: PlansStudentsPageProps) {
    const {facultyId, fieldOfStudyId, semesterId, specializationId} = useParams();
    const intl = useIntl();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [currentField, setCurrentField] = useState<StudyField | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => { setPage(1); }, [search, view]);

    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [
            { label: intl.formatMessage({id: 'plans.plans'}), path: '/plans' },
            { label: intl.formatMessage({id: 'plans.studentsPlan.title'}), path: '/plans/study/faculty' }
        ];

        if (facultyId) {
            items.push({
                label: currentFaculty ? currentFaculty.faculty_short : facultyId,
                path: `/plans/study/faculty/${facultyId}/field`
            });
        }
        if (fieldOfStudyId) {
            items.push({
                label: currentField ? currentField.field_name : fieldOfStudyId,
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`
            });
        }
        if (semesterId) {
            items.push({
                label: `${intl.formatMessage({id: 'plans.studentsPlan.studySemester.semester', defaultMessage: 'Semestr'})} ${semesterId}`,
                path: specializationId
                    ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization`
                    : `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group`
            });
        }
        if (specializationId) {
            items.push({
                label: `Spec. ${specializationId}`,
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${specializationId}/group`
            });
        }
        return items;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const offset = (page - 1) * pageSize;

            if (facultyId && !currentFaculty) setCurrentFaculty(await getFaculty(Number(facultyId)) as Faculty);
            if (fieldOfStudyId && !currentField) setCurrentField(await getStudyField(Number(fieldOfStudyId)) as StudyField);

            if (view === 'faculties') {
                const res = await fetchFaculties(page, pageSize, { faculty_name: search.trim() || undefined });
                setData(res.items);
                setTotalItems(res.total);
            }
            else if (view === 'fields' && facultyId) {
                const res = await fetchStudyFields(page, pageSize, { faculty: Number(facultyId) });
                const filtered = search.trim()
                    ? res.items.filter((f: StudyField) => f.field_name.toLowerCase().includes(search.toLowerCase()))
                    : res.items;
                setData(filtered);
                setTotalItems(filtered.length);
            }
            else if (view === 'semesters' && fieldOfStudyId) {
                const res = await fetchMockStudyFieldSemesters(Number(fieldOfStudyId));
                setData(res.slice(offset, offset + pageSize));
                setTotalItems(res.length);
            }
            else if (view === 'specializations' && fieldOfStudyId && semesterId) {
                const res = await fetchMockStudyPlanSpecializations({
                    fieldOfStudyId: Number(fieldOfStudyId),
                    semesterId: Number(semesterId)
                });
                const filtered = search.trim()
                    ? res.filter((s: StudyPlanSpecializationSummary) => s.name.toLowerCase().includes(search.toLowerCase()))
                    : res;
                setData(filtered.slice(offset, offset + pageSize));
                setTotalItems(filtered.length);
            }
            else if (view === 'groups' && fieldOfStudyId && semesterId) {
                let res: StudyPlanGroupSummary[];
                if (specializationId) {
                    res = await fetchMockStudyPlanSpecializationGroups(Number(specializationId));
                } else {
                    res = await fetchMockStudyPlanGroups(
                        Number(fieldOfStudyId),
                        Number(semesterId)
                    );
                }
                const filtered = search.trim()
                    ? res.filter((g: StudyPlanGroupSummary) => g.group_name.toLowerCase().includes(search.toLowerCase()))
                    : res;
                setData(filtered.slice(offset, offset + pageSize));
                setTotalItems(filtered.length);
            }
            else if (view === 'fields' && facultyId) {
                const res = await fetchStudyFields(pageSize, offset, { faculty: Number(facultyId) });
                const filtered = search.trim()
                    ? res.items.filter((f: StudyField) => f.field_name.toLowerCase().includes(search.toLowerCase()))
                    : res.items;
                setData(filtered);
                setTotalItems(res.total);
            }
        } catch (err: unknown) {
            setError((err as Error).message ?? 'Wystąpił błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, fieldOfStudyId, semesterId, specializationId, page, pageSize, search, currentFaculty, currentField]);

    useEffect(() => { void loadData(); }, [loadData]);

    const handlePageSizeChange = (v: number) => {
        setPageSize(v);
        setPage(1);
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar placeholder={intl.formatMessage({id: 'facilities.common.searchPlaceholder'})} value={search} onChange={setSearch} />
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Box sx={{ px: {xs: 2, md: 3}, py: {xs: 2.5, md: 3}, borderRadius: 2, bgcolor: '#FBFCFF', minHeight: 420 }}>
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        {view === 'faculties' && <PlansStudentFacultyView data={data as Faculty[]} />}

                        {view === 'fields' && <PlansStudentFieldView
                            data={data as StudyField[]} facultyId={Number(facultyId)} page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={handlePageSizeChange}/>}

                        {view === 'semesters' && <PlansStudentSemesterView
                            data={data as StudyFieldSemesterSummary[]} facultyId={Number(facultyId)} fieldOfStudyId={Number(fieldOfStudyId)} page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={handlePageSizeChange}/>}

                        {view === 'specializations' && <PlansStudentSpecializationView
                            data={data as StudyPlanSpecializationSummary[]} facultyId={Number(facultyId)} fieldOfStudyId={Number(fieldOfStudyId)} semesterId={Number(semesterId)} page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={handlePageSizeChange}/>}

                        {view === 'groups' && <PlansStudentGroupView
                            data={data as StudyPlanGroupSummary[]} facultyId={Number(facultyId)} fieldOfStudyId={Number(fieldOfStudyId)} semesterId={Number(semesterId)} specializationId={specializationId ? Number(specializationId) : undefined} page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={handlePageSizeChange}/>}
                    </>
                )}
            </Box>
        </Box>
    );
}