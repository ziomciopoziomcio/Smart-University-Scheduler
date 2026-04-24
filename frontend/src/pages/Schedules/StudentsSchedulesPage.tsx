import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert, Typography} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar} from '@components/Common';
import {
    fetchFaculties,
    getFaculty,
    fetchStudyFields,
    getStudyField,
    fetchMajors,
    fetchStudyFieldSemesterSummary,
    type Faculty,
    type StudyField,
    type StudyFieldSemesterSummary,
    type StudyPlanGroupSummary
} from '@api';

import {
    ScheduleStudentFacultyView,
    ScheduleStudentSemesterView,
    ScheduleStudentMajorView,
    ScheduleStudentGroupView,
    ScheduleStudentFieldView
} from '@components/Schedule';
import {fetchMockStudyPlanMajorGroups} from '../../mocks/studyPlanMajorsGroupsMock.tsx';
import {fetchMockStudyPlanGroups} from '../../mocks/studyPlanSemesterGroupsMock.tsx';

interface StudentsSchedulesPageProps {
    view: 'faculties' | 'fields' | 'semesters' | 'majors' | 'groups';
}

export default function StudentsSchedulesPage({view}: StudentsSchedulesPageProps) {
    const {facultyId, fieldOfStudyId, semesterId, majorId} = useParams();
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

    useEffect(() => {
        setPage(1);
    }, [search, view]);

    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [
            {label: intl.formatMessage({id: 'plans.plans'}), path: '/schedules'},
            {label: intl.formatMessage({id: 'plans.studentsPlan.title'}), path: '/schedules/study/faculty'}
        ];

        if (facultyId) {
            items.push({
                label: currentFaculty ? currentFaculty.faculty_short : facultyId,
                path: `/schedules/study/faculty/${facultyId}/field`
            });
        }

        if (fieldOfStudyId) {
            items.push({
                label: currentField ? currentField.field_name : fieldOfStudyId,
                path: `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`
            });
        }

        if (semesterId) {
            items.push({
                label: `${intl.formatMessage({id: 'plans.studentsPlan.studySemester.semester'})} ${semesterId}`,
                path: majorId
                    ? `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/major`
                    : `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group`
            });
        }

        return items;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const offset = (page - 1) * pageSize;

            if (facultyId && !currentFaculty) {
                setCurrentFaculty(await getFaculty(Number(facultyId)) as Faculty);
            }

            if (fieldOfStudyId && !currentField) {
                setCurrentField(await getStudyField(Number(fieldOfStudyId)));
            }

            if (view === 'faculties') {
                const res = await fetchFaculties(page, pageSize, {
                    faculty_name: search.trim() || undefined
                });

                setData(res.items);
                setTotalItems(res.total);
            } else if (view === 'fields' && facultyId) {
                const res = await fetchStudyFields(page, pageSize, {
                    faculty: Number(facultyId),
                    field_name: search.trim() || undefined
                });

                setData(res.items);
                setTotalItems(res.total);
            } else if (view === 'semesters' && fieldOfStudyId) {
                const res = await fetchStudyFieldSemesterSummary(Number(fieldOfStudyId));
                const filtered = search.trim()
                    ? res.filter((semester) =>
                        String(semester.semester_number).includes(search.trim())
                    )
                    : res;

                setData(filtered.slice(offset, offset + pageSize));
                setTotalItems(filtered.length);
            } else if (view === 'majors' && fieldOfStudyId) {
                const res = await fetchMajors(page, pageSize, {
                    study_field: Number(fieldOfStudyId),
                    major_name: search.trim() || undefined
                });

                const mapped = res.items.map((m) => ({
                    id: m.id,
                    name: m.major_name,
                    groups_count: m.group_count || 0
                }));

                setData(mapped);
                setTotalItems(res.total);
            } else if (view === 'groups' && fieldOfStudyId && semesterId) {
                let res: StudyPlanGroupSummary[];

                if (majorId) {
                    res = await fetchMockStudyPlanMajorGroups(Number(majorId));
                } else {
                    res = await fetchMockStudyPlanGroups(
                        Number(fieldOfStudyId),
                        Number(semesterId)
                    );
                }

                const filtered = search.trim()
                    ? res.filter((g) =>
                        g.group_name.toLowerCase().includes(search.toLowerCase())
                    )
                    : res;

                setData(filtered.slice(offset, offset + pageSize));
                setTotalItems(filtered.length);
            }
        } catch (err: any) {
            setError(err.message ?? 'Wystąpił błąd');
        } finally {
            setLoading(false);
        }
    }, [
        view,
        facultyId,
        fieldOfStudyId,
        semesterId,
        majorId,
        page,
        pageSize,
        search,
        currentFaculty,
        currentField
    ]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'facilities.common.searchPlaceholder'})}
                value={search}
                onChange={setSearch}
            />

            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Box
                sx={{
                    px: {xs: 2, md: 3},
                    py: {xs: 2.5, md: 3},
                    borderRadius: 2,
                    bgcolor: '#FBFCFF',
                    minHeight: 420
                }}
            >
                {loading && (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                        <CircularProgress/>
                    </Box>
                )}

                {error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && data.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 260,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="body1" color="text.secondary">
                            {intl.formatMessage({id: 'facilities.common.noData'})}
                        </Typography>
                    </Box>
                )}

                {!loading && !error && data.length > 0 && (
                    <>
                        {view === 'faculties' && (
                            <ScheduleStudentFacultyView data={data as Faculty[]}/>
                        )}

                        {view === 'fields' && (
                            <ScheduleStudentFieldView
                                data={data as StudyField[]}
                                facultyId={Number(facultyId)}
                                page={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(v) => {
                                    setPageSize(v);
                                    setPage(1);
                                }}
                            />
                        )}

                        {view === 'semesters' && (
                            <ScheduleStudentSemesterView
                                data={data as StudyFieldSemesterSummary[]}
                                facultyId={Number(facultyId)}
                                fieldOfStudyId={Number(fieldOfStudyId)}
                                page={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(v) => {
                                    setPageSize(v);
                                    setPage(1);
                                }}
                            />
                        )}

                        {view === 'majors' && (
                            <ScheduleStudentMajorView
                                data={data}
                                facultyId={Number(facultyId)}
                                fieldOfStudyId={Number(fieldOfStudyId)}
                                semesterId={Number(semesterId)}
                                page={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(v) => {
                                    setPageSize(v);
                                    setPage(1);
                                }}
                            />
                        )}

                        {view === 'groups' && (
                            <ScheduleStudentGroupView
                                data={data as StudyPlanGroupSummary[]}
                                facultyId={Number(facultyId)}
                                fieldOfStudyId={Number(fieldOfStudyId)}
                                semesterId={Number(semesterId)}
                                majorId={majorId ? Number(majorId) : undefined}
                                page={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(v) => {
                                    setPageSize(v);
                                    setPage(1);
                                }}
                            />
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}