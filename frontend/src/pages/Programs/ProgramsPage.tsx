import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert, Paper} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar, ListPagination} from '@components/Common';
import {
    fetchFaculties, getFaculty, type Faculty,
    fetchStudyFields, getStudyField, type StudyField,
    fetchStudyPrograms, getStudyProgram, type StudyProgram,
    fetchCurriculum
} from '@api';

import {
    ProgramFacultyView,
    ProgramFieldView,
    ProgramListView,
    ProgramSemesterView,
    ProgramCurriculumView
} from '@components/Programs';

interface ProgramsPageProps {
    view: 'faculties' | 'fields' | 'programs' | 'semesters' | 'curriculum';
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
        return () => clearTimeout(timer);
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
                const res = await fetchFaculties(page, pageSize, debouncedSearch);
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
            } else if (view === 'semesters' && currentField) {
                const count = currentField.semesters_count || 7;
                const semestersList = Array.from({length: count}, (_, i) => ({
                    id: i + 1,
                    name: `${intl.formatMessage({id: 'programs.semester'})} ${i + 1}`
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
            }
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Błąd ładowania danych');
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, fieldId, programId, semesterId, page, pageSize, debouncedSearch, currentField]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [{label: intl.formatMessage({id: 'programs.title'}), path: '/programs'}];

        if (['fields', 'programs', 'semesters', 'curriculum'].includes(view)) {
            items.push({
                label: currentFaculty ? currentFaculty.faculty_short : intl.formatMessage({id: 'programs.faculties.title'}),
                path: view !== 'fields' ? `/programs/faculty/${facultyId}` : undefined
            });
        }
        if (['programs', 'semesters', 'curriculum'].includes(view)) {
            items.push({
                label: currentField ? currentField.field_name : intl.formatMessage({id: 'programs.fields.title'}),
                path: view !== 'programs' ? `/programs/faculty/${facultyId}/field/${fieldId}` : undefined
            });
        }
        if (['semesters', 'curriculum'].includes(view)) {
            items.push({
                label: currentProgram ? (currentProgram.program_name || currentProgram.start_year) : intl.formatMessage({id: 'programs.list.title'}),
                path: view !== 'semesters' ? `/programs/faculty/${facultyId}/field/${fieldId}/program/${programId}` : undefined
            });
        }
        if (view === 'curriculum' && semesterId) {
            items.push({label: `${intl.formatMessage({id: 'programs.semester'})} ${semesterId}`});
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

                        {view === 'curriculum' && (
                            <ProgramCurriculumView
                                data={data}
                                programId={Number(programId)}
                                semesterId={Number(semesterId)}
                                fieldId={Number(fieldId)}
                                onRefresh={loadData}
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

                        {!loading && data.length === 0 && (
                            <Alert severity="info">{intl.formatMessage({id: 'programs.noData'})}</Alert>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}