import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar, ListPagination} from '@components/Common';
import {
    fetchFaculties, getFaculty, fetchUnits, getUnit, fetchStudyFields, getStudyField,
    type Faculty, type Unit, type StudyField, getCourse, type Course,
    fetchMajors, fetchElectiveBlocks, fetchCourses, fetchCourseInstructors,
    fetchStudyPrograms, getStudyProgram, type StudyProgram,
    fetchCurriculum, fetchGroups, getGroup, type Group
} from '@api';

import {
    DidacticsDashboardView, FieldDashboardView, MajorView, BlockView, DidacticsFacultyView,
    DidacticsStudyFieldView, DidacticsUnitView, DidacticsCourseView, CourseInstructorsView,
    ProgramListView, ProgramSemesterView, ProgramCurriculumView,
    ProgramSemesterDashboardView, ProgramGroupView, ProgramGroupStudentsView
} from '@components/Didactics';

export default function DidacticsPage({view}: { view: string }) {
    const {facultyId, fieldId, unitId, courseCode, programId, semesterId, groupId} = useParams();
    const intl = useIntl();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<unknown[]>([]);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [currentField, setCurrentField] = useState<StudyField | null>(null);
    const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
    const [currentProgram, setCurrentProgram] = useState<StudyProgram | null>(null);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

    useEffect(() => {
        setPage(1);
        setSearch('');
        setDebouncedSearch('');
    }, [view, facultyId, fieldId, unitId, courseCode, programId, semesterId, groupId]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch metadata and keep in local variables for immediate use in current cycle
            let activeProgram = currentProgram;

            if (facultyId) {
                const fid = Number(facultyId);
                if (!currentFaculty || currentFaculty.id !== fid) {
                    const res = await getFaculty(fid);
                    setCurrentFaculty(res);
                }
            }
            if (fieldId) {
                const fid = Number(fieldId);
                if (!currentField || currentField.id !== fid) {
                    const res = await getStudyField(fid);
                    setCurrentField(res);
                }
            }
            if (unitId) {
                const uid = Number(unitId);
                if (!currentUnit || currentUnit.id !== uid) {
                    const res = await getUnit(uid);
                    setCurrentUnit(res);
                }
            }
            if (courseCode) {
                const code = Number(courseCode);
                if (!currentCourse || currentCourse.course_code !== code) {
                    const res = await getCourse(code);
                    setCurrentCourse(res);
                }
            }
            if (programId) {
                const pid = Number(programId);
                if (!currentProgram || currentProgram.id !== pid) {
                    activeProgram = await getStudyProgram(pid);
                    setCurrentProgram(activeProgram);
                }
            }
            if (groupId) {
                const gid = Number(groupId);
                if (!currentGroup || currentGroup.id !== gid) {
                    const res = await getGroup(gid);
                    setCurrentGroup(res);
                }
            }

            let res;
            if (view === 'faculties_for_fields' || view === 'faculties_for_courses') {
                res = await fetchFaculties(page, pageSize, {}, debouncedSearch);
            } else if (view === 'fields') {
                res = await fetchStudyFields(page, pageSize, {faculty: Number(facultyId)}, debouncedSearch);
            } else if (view === 'units_for_courses') {
                res = await fetchUnits(
                    page,
                    pageSize,
                    {
                        faculty_id: Number(facultyId),
                    },
                    debouncedSearch || undefined,
                );
            } else if (view === 'majors') {
                res = await fetchMajors(page, pageSize, debouncedSearch, {study_field: Number(fieldId)});
            } else if (view === 'blocks') {
                res = await fetchElectiveBlocks(page, pageSize, debouncedSearch, {study_field: Number(fieldId)});
            } else if (view === 'catalog') {
                res = await fetchCourses(page, pageSize, debouncedSearch, {leading_unit: Number(unitId)});
            } else if (view === 'course_instructors') {
                res = await fetchCourseInstructors(Number(courseCode), page, pageSize);
            } else if (view === 'programs') {
                res = await fetchStudyPrograms(page, pageSize, debouncedSearch, {study_field: Number(fieldId)});
            } else if (view === 'semesters' && activeProgram) {
                const summary = activeProgram.semester_summary || [];
                const semestersList = summary.map(s => ({
                    id: s.semester_number,
                    name: `${intl.formatMessage({id: 'didactics.semesters.title'})} ${s.semester_number}`,
                    courses_count: s.courses_count,
                    ects_sum: s.ects_sum
                }));
                res = {items: semestersList, total: semestersList.length};
            } else if (view === 'curriculum' && programId && semesterId) {
                res = await fetchCurriculum(page, pageSize, debouncedSearch, {
                    study_program: Number(programId),
                    semester: Number(semesterId)
                });
            } else if (view === 'groups' && programId && semesterId) {
                res = await fetchGroups(page, pageSize, {
                    study_program: Number(programId),
                    semester: Number(semesterId)
                }, debouncedSearch);
            }

            if (res) {
                setData(res.items || []);
                setTotalItems(res.total || 0);
            }
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : intl.formatMessage({id: 'didactics.common.noData'}));
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, fieldId, unitId, courseCode, programId, semesterId, groupId, page, pageSize, debouncedSearch, intl]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const breadcrumbs: BreadcrumbItem[] = [
            {label: intl.formatMessage({id: 'didactics.breadcrumbs.main'}), path: '/didactics'}
        ];

        const isFieldsPath = ['faculties_for_fields', 'fields', 'field_dashboard', 'majors', 'blocks', 'programs', 'semesters', 'semester-dashboard', 'curriculum', 'groups', 'group_members'].includes(view);

        if (isFieldsPath) {
            breadcrumbs.push({
                label: intl.formatMessage({id: 'didactics.breadcrumbs.fields'}),
                path: '/didactics/fields'
            });
            if (currentFaculty && facultyId) breadcrumbs.push({
                label: currentFaculty.faculty_short,
                path: view !== 'fields' ? `/didactics/fields/faculty/${facultyId}` : undefined
            });
            if (currentField && fieldId) breadcrumbs.push({
                label: currentField.field_name,
                path: view !== 'field_dashboard' ? `/didactics/fields/faculty/${facultyId}/field/${fieldId}` : undefined
            });
            if (view === 'majors') breadcrumbs.push({label: intl.formatMessage({id: 'didactics.breadcrumbs.majors'})});
            if (view === 'blocks') breadcrumbs.push({label: intl.formatMessage({id: 'didactics.breadcrumbs.blocks'})});
            if (view === 'programs') breadcrumbs.push({label: intl.formatMessage({id: 'didactics.fieldDashboard.programsTitle'})});

            if (['semesters', 'semester-dashboard', 'curriculum', 'groups', 'group_members'].includes(view)) {
                breadcrumbs.push({
                    label: intl.formatMessage({id: 'didactics.fieldDashboard.programsTitle'}),
                    path: `/didactics/fields/faculty/${facultyId}/field/${fieldId}/programs`
                });
                if (currentProgram) breadcrumbs.push({
                    label: currentProgram.start_year,
                    path: view !== 'semesters' ? `/didactics/fields/faculty/${facultyId}/field/${fieldId}/program/${programId}` : undefined
                });
            }

            if (['semester-dashboard', 'curriculum', 'groups', 'group_members'].includes(view) && semesterId) {
                breadcrumbs.push({
                    label: `${intl.formatMessage({id: 'didactics.programs.semester'})} ${semesterId}`,
                    path: view !== 'semester-dashboard' ? `/didactics/fields/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${semesterId}` : undefined
                });
            }

            if (view === 'curriculum') breadcrumbs.push({label: intl.formatMessage({id: 'didactics.programs.dashboard.curriculumTitle'})});
            if (['groups', 'group_members'].includes(view)) {
                breadcrumbs.push({
                    label: intl.formatMessage({id: 'didactics.programs.dashboard.groupsTitle'}),
                    path: view === 'group_members' ? `/didactics/fields/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${semesterId}/groups` : undefined
                });
            }
            if (view === 'group_members' && currentGroup) {
                breadcrumbs.push({label: currentGroup.group_name});
            }
        }

        if (['faculties_for_courses', 'units_for_courses', 'catalog', 'course_instructors'].includes(view)) {
            breadcrumbs.push({
                label: intl.formatMessage({id: 'didactics.breadcrumbs.courses'}),
                path: '/didactics/courses'
            });
            if (currentFaculty && facultyId) breadcrumbs.push({
                label: currentFaculty.faculty_short,
                path: view !== 'units_for_courses' ? `/didactics/courses/faculty/${facultyId}` : undefined
            });
            if (currentUnit && unitId) breadcrumbs.push({
                label: currentUnit.unit_short || currentUnit.unit_name,
                path: view !== 'catalog' ? `/didactics/courses/faculty/${facultyId}/unit/${unitId}` : undefined
            });

            if (currentCourse && courseCode && view === 'course_instructors') {
                breadcrumbs.push({label: currentCourse.course_name});
            }
        }
        return breadcrumbs;
    };

    const showSearch = ['faculties_for_fields', 'faculties_for_courses', 'fields', 'majors', 'blocks', 'catalog', 'units_for_courses', 'programs', 'curriculum', 'groups'].includes(view);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, width: '100%'}}>
            {showSearch && (
                <SearchBar value={search} onChange={setSearch}
                           placeholder={intl.formatMessage({id: 'didactics.common.search'})}/>
            )}

            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Box sx={{flexGrow: 1}}>
                {loading && !['group_members'].includes(view) ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}><CircularProgress/></Box>
                ) : (
                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: view === 'group_members' ? 'transparent' : '#ffffff',
                        boxShadow: view === 'group_members' ? 'none' : '0 2px 12px rgba(0, 0, 0, 0.06)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        p: view === 'group_members' ? 0 : {xs: 1, md: 2}
                    }}>
                        {error && <Alert severity="error" sx={{mb: 3}}>{error}</Alert>}

                        {view === 'dashboard' && <DidacticsDashboardView/>}
                        {view === 'field_dashboard' && <FieldDashboardView/>}

                        {view === 'faculties_for_fields' &&
                            <DidacticsFacultyView data={data} basePath="/didactics/fields/faculty"/>}
                        {view === 'fields' &&
                            <DidacticsStudyFieldView data={data} facultyId={Number(facultyId)} onRefresh={loadData}/>}

                        {view === 'majors' && <MajorView data={data} fieldId={Number(fieldId)} onRefresh={loadData}/>}
                        {view === 'blocks' && <BlockView data={data} fieldId={Number(fieldId)} onRefresh={loadData}/>}
                        {view === 'catalog' &&
                            <DidacticsCourseView data={data} unitId={Number(unitId)} facultyId={Number(facultyId)}
                                                 onRefresh={loadData}/>}
                        {view === 'course_instructors' &&
                            <CourseInstructorsView data={data} courseCode={Number(courseCode)}
                                                   facultyId={Number(facultyId)} onRefresh={loadData}/>}

                        {view === 'programs' && (
                            <ProgramListView
                                data={data as StudyProgram[]}
                                facultyId={Number(facultyId)}
                                fieldId={Number(fieldId)}
                                fieldName={currentField?.field_name || ''}
                                onRefresh={loadData}
                                basePath="/didactics/fields/faculty"
                            />
                        )}

                        {view === 'semesters' && (
                            <ProgramSemesterView
                                data={data as any[]}
                                facultyId={Number(facultyId)}
                                fieldId={Number(fieldId)}
                                programId={Number(programId)}
                                basePath="/didactics/fields/faculty"
                            />
                        )}

                        {view === 'semester-dashboard' && (
                            <ProgramSemesterDashboardView
                                facultyId={Number(facultyId)}
                                fieldId={Number(fieldId)}
                                programId={Number(programId)}
                                semesterId={Number(semesterId)}
                                basePath={`/didactics/fields/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${semesterId}`}
                            />
                        )}

                        {view === 'curriculum' && (
                            <ProgramCurriculumView
                                data={data as any[]}
                                programId={Number(programId)}
                                semesterId={Number(semesterId)}
                                fieldId={Number(fieldId)}
                                fieldName={currentField?.field_name || ''}
                                onRefresh={loadData}
                            />
                        )}

                        {view === 'groups' && (
                            <ProgramGroupView
                                data={data as any[]}
                                programId={Number(programId)}
                                semesterId={Number(semesterId)}
                                fieldId={Number(fieldId)}
                                facultyId={Number(facultyId)}
                                fieldName={currentField?.field_name || ''}
                                onRefresh={loadData}
                            />
                        )}

                        {view === 'group_members' && (
                            <ProgramGroupStudentsView
                                groupId={Number(groupId)}
                                programId={Number(programId)}
                            />
                        )}

                        {view === 'faculties_for_courses' &&
                            <DidacticsFacultyView data={data} basePath="/didactics/courses/faculty"/>}
                        {view === 'units_for_courses' && <DidacticsUnitView data={data} facultyId={Number(facultyId)}/>}

                        {!['dashboard', 'field_dashboard', 'semester-dashboard', 'group_members'].includes(view) && totalItems > 0 && (
                            <ListPagination
                                page={page}
                                totalItems={totalItems}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={(size) => {
                                    setPageSize(size);
                                    setPage(1);
                                }}
                            />
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
