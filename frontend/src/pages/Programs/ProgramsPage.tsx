import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert, Paper} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar, ListPagination} from '@components/Common';
import {
    fetchFaculties, getFaculty, type Faculty,
    fetchStudyFields, getStudyField, type StudyField,
    fetchStudyPrograms, getStudyProgram, type StudyProgram,
    fetchCurriculum, fetchGroups
} from '@api';

import {
    ProgramFacultyView,
    ProgramFieldView,
    ProgramListView,
    ProgramSemesterView,
    ProgramCurriculumView
} from '@components/Programs';
import {ProgramGroupView} from "@components/Programs/Views/ProgramGroupView.tsx";
import {ProgramSemesterDashboardView} from "@components/Programs/Views/ProgramSemesterDashboardView.tsx";

interface ProgramsPageProps {
    view: 'faculties' | 'fields' | 'programs' | 'semesters' | 'semester-dashboard' | 'curriculum' | 'groups';
}

export default function ProgramsPage({view}: ProgramsPageProps) {
    const {facultyId, fieldId, programId, semesterId} = useParams();
    const intl = useIntl();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [currentField, setCurrentField] = useState<StudyField | null>(null);
    const [currentProgram, setCurrentProgram] = useState<StudyProgram | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        setPage(1);
        setSearch('');
        setData([]);
        setLoading(true);
        setError(null);
    }, [view, facultyId, fieldId, programId, semesterId]);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (facultyId) getFaculty(Number(facultyId)).then(setCurrentFaculty).catch(console.error);
            else setCurrentFaculty(null);

            if (fieldId) getStudyField(Number(fieldId)).then(setCurrentField).catch(console.error);
            else setCurrentField(null);

            if (programId) getStudyProgram(Number(programId)).then(setCurrentProgram).catch(console.error);
            else setCurrentProgram(null);
        };
        void fetchMetadata();
    }, [facultyId, fieldId, programId]);

    const loadData = useCallback(async () => {
        if (view === 'fields' && !facultyId) return;
        if (view === 'programs' && (!facultyId || !fieldId)) return;
        if (view === 'semesters' && (!facultyId || !fieldId || !programId)) return;
        if (view === 'curriculum' && (!facultyId || !fieldId || !programId || !semesterId)) return;

        setLoading(true);
        try {
            if (view === 'faculties') {
                const res = await fetchFaculties(page, pageSize, undefined, debouncedSearch);
                setData(res.items || []);
                setTotalItems(res.total || 0);
            } else if (view === 'fields' && facultyId) {
                const res = await fetchStudyFields(page, pageSize, debouncedSearch, {faculty: Number(facultyId)});
                setData(res.items || []);
                setTotalItems(res.total || 0);
            } else if (view === 'programs' && fieldId) {
                const res = await fetchStudyPrograms(page, pageSize, debouncedSearch, {study_field: Number(fieldId)});
                setData(res.items || []);
                setTotalItems(res.total || 0);
            } else if (view === 'semesters' && currentProgram) {
                const summary = currentProgram.semester_summary || [];

                const semestersList = summary.map(s => ({
                    id: s.semester_number,
                    name: `${intl.formatMessage({id: 'programs.semester'})} ${s.semester_number}`,
                    courses_count: s.courses_count,
                    ects_sum: s.ects_sum
                }));

                const filtered = debouncedSearch
                    ? semestersList.filter(s => s.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
                    : semestersList;

                setData(filtered);
                setTotalItems(0);

            } else if (view === 'curriculum' && programId && semesterId) {

                const res = await fetchCurriculum(page, pageSize, debouncedSearch, {
                    study_program: Number(programId),
                    semester: Number(semesterId)
                });
                setData(res.items || []);
                setTotalItems(res.total || 0);
            } else if (view === 'groups' && programId && semesterId) {

                const res = await fetchGroups(page, pageSize, {
                    study_program: Number(programId),
                    semester: Number(semesterId)
                }, debouncedSearch);

                setData(res.items || []);
                setTotalItems(res.total || 0);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message || intl.formatMessage({id: 'programs.errorLoading'}));
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, fieldId, programId, semesterId, page, pageSize, debouncedSearch, currentField, currentProgram]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [{label: intl.formatMessage({id: 'programs.title'}), path: '/programs'}];

        const hasFaculty = ['fields', 'programs', 'semesters', 'semester-dashboard', 'curriculum', 'groups'].includes(view);
        const hasField = ['programs', 'semesters', 'semester-dashboard', 'curriculum', 'groups'].includes(view);
        const hasProgram = ['semesters', 'semester-dashboard', 'curriculum', 'groups'].includes(view);
        const hasSemester = ['semester-dashboard', 'curriculum', 'groups'].includes(view);

        if (hasFaculty) {
            items.push({
                label: currentFaculty ? currentFaculty.faculty_short : intl.formatMessage({id: 'programs.faculties.title'}),
                path: view !== 'fields' ? `/programs/faculty/${facultyId}` : undefined
            });
        }
        if (hasField) {
            items.push({
                label: currentField ? currentField.field_name : intl.formatMessage({id: 'programs.fields.title'}),
                path: view !== 'programs' ? `/programs/faculty/${facultyId}/field/${fieldId}` : undefined
            });
        }
        if (hasProgram) {
            items.push({
                label: currentProgram ? currentProgram.start_year : intl.formatMessage({id: 'programs.list.title'}),
                path: view !== 'semesters' ? `/programs/faculty/${facultyId}/field/${fieldId}/program/${programId}` : undefined
            });
        }
        if (hasSemester && semesterId) {
            items.push({
                label: `${intl.formatMessage({id: 'programs.semester'})} ${semesterId}`,
                path: view !== 'semester-dashboard' ? `/programs/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${semesterId}` : undefined
            });
        }

        if (view === 'curriculum') {
            items.push({
                label: intl.formatMessage({
                    id: 'programs.dashboard.curriculumTitle',
                    defaultMessage: 'Siatka zajęć'
                })
            });
        }
        if (view === 'groups') {
            items.push({
                label: intl.formatMessage({
                    id: 'programs.dashboard.groupsTitle',
                    defaultMessage: 'Grupy dziekańskie'
                })
            });
        }

        return items;
    };


    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar value={search} onChange={setSearch}
                       placeholder={intl.formatMessage({id: 'programs.searchPlaceholder'})}/>
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1, mb: 3}}>
                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <Box key={`${view}-${facultyId}-${fieldId}-${programId}-${semesterId}`}>

                        {view === 'faculties' && <ProgramFacultyView data={data}/>}

                        {view === 'fields' && <ProgramFieldView data={data} facultyId={Number(facultyId)}/>}

                        {view === 'programs' && (
                            <ProgramListView
                                data={data}
                                facultyId={Number(facultyId)}
                                fieldId={Number(fieldId)}
                                fieldName={currentField?.field_name || ''}
                                onRefresh={loadData}
                            />
                        )}

                        {view === 'semesters' && (
                            <ProgramSemesterView
                                data={data}
                                facultyId={Number(facultyId)}
                                fieldId={Number(fieldId)}
                                programId={Number(programId)}
                            />
                        )}

                        {view === 'semester-dashboard' && (
                            <ProgramSemesterDashboardView
                                facultyId={Number(facultyId)}
                                fieldId={Number(fieldId)}
                                programId={Number(programId)}
                                semesterId={Number(semesterId)}
                            />
                        )}

                        {view === 'curriculum' && (
                            <ProgramCurriculumView
                                data={data}
                                programId={Number(programId)}
                                semesterId={Number(semesterId)}
                                fieldId={Number(fieldId)}
                                onRefresh={loadData}
                            />
                        )}

                        {view === 'groups' && (
                            <ProgramGroupView
                                data={data}
                                programId={Number(programId)}
                                semesterId={Number(semesterId)}
                                fieldId={Number(fieldId)}
                                onRefresh={loadData}
                                facultyId={Number(facultyId)}
                            />
                        )}

                        {totalItems > 0 && view !== 'faculties' && view !== 'semesters' && (
                            <ListPagination
                                page={page} totalItems={totalItems} pageSize={pageSize}
                                onPageChange={setPage} onPageSizeChange={(s) => {
                                setPageSize(s);
                                setPage(1);
                            }}
                            />
                        )}

                        {!loading && data.length === 0 && view !== 'semester-dashboard' && (
                            <Alert severity="info">{intl.formatMessage({id: 'programs.noData'})}</Alert>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}