import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar, ListPagination} from '@components/Common';
import {
    fetchFaculties, getFaculty, fetchUnits, getUnit, fetchStudyFields, getStudyField,
    type Faculty, type Unit, type StudyField, getCourse, type Course,
    fetchMajors, fetchElectiveBlocks, fetchCourses, fetchCourseInstructors
} from '@api';

import {
    DidacticsDashboardView, FieldDashboardView, MajorView, BlockView, DidacticsFacultyView,
    DidacticsStudyFieldView, DidacticsUnitView, DidacticsCourseView, CourseInstructorsView
} from '@components/Didactics';

export default function DidacticsPage({view}: { view: string }) {
    const {facultyId, fieldId, unitId, courseCode} = useParams();
    const intl = useIntl();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [currentField, setCurrentField] = useState<StudyField | null>(null);
    const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

    useEffect(() => {
        setPage(1);
        setSearch('');
        setDebouncedSearch('');
    }, [view, facultyId, fieldId, unitId, courseCode]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (facultyId && (!currentFaculty || currentFaculty.id !== Number(facultyId)))
                setCurrentFaculty(await getFaculty(Number(facultyId)));
            if (fieldId && (!currentField || currentField.id !== Number(fieldId)))
                setCurrentField(await getStudyField(Number(fieldId)));
            if (unitId && (!currentUnit || currentUnit.id !== Number(unitId)))
                setCurrentUnit(await getUnit(Number(unitId)));
            if (courseCode && (!currentCourse || currentCourse.course_code !== Number(courseCode)))
                setCurrentCourse(await getCourse(Number(courseCode)));

            let res;
            if (view === 'faculties_for_fields' || view === 'faculties_for_courses') {
                res = await fetchFaculties(page, pageSize, debouncedSearch);
            } else if (view === 'fields') {
                res = await fetchStudyFields(page, pageSize, debouncedSearch, {faculty: Number(facultyId)});
            } else if (view === 'units_for_courses') {
                res = await fetchUnits(Number(facultyId), page, pageSize, debouncedSearch);
            } else if (view === 'majors') {
                res = await fetchMajors(page, pageSize, debouncedSearch, {study_field: Number(fieldId)});
            } else if (view === 'blocks') {
                res = await fetchElectiveBlocks(page, pageSize, debouncedSearch, {study_field: Number(fieldId)});
            } else if (view === 'catalog') {
                res = await fetchCourses(page, pageSize, debouncedSearch, {leading_unit: Number(unitId)});
            } else if (view === 'course_instructors') {
                res = await fetchCourseInstructors(Number(courseCode), page, pageSize);
            }

            if (res) {
                setData(res.items || []);
                setTotalItems(res.total || 0);
            }
        } catch (err: any) {
            console.error(err);
            setError(intl.formatMessage({id: 'didactics.common.noData'}));
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, fieldId, unitId, courseCode, page, pageSize, debouncedSearch]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const breadcrumbs: BreadcrumbItem[] = [
            {label: intl.formatMessage({id: 'didactics.breadcrumbs.main'}), path: '/didactics'}
        ];

        if (['faculties_for_fields', 'fields', 'field_dashboard', 'majors', 'blocks'].includes(view)) {
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

    const showSearch = ['faculties_for_fields', 'faculties_for_courses', 'fields', 'majors', 'blocks', 'catalog', 'units_for_courses'].includes(view);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, width: '100%'}}>
            {showSearch && (
                <SearchBar value={search} onChange={setSearch}
                           placeholder={intl.formatMessage({id: 'didactics.common.search'})}/>
            )}

            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Box sx={{flexGrow: 1}}>
                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}><CircularProgress/></Box>
                ) : (
                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#ffffff',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        p: {xs: 1, md: 2}
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

                        {view === 'faculties_for_courses' &&
                            <DidacticsFacultyView data={data} basePath="/didactics/courses/faculty"/>}
                        {view === 'units_for_courses' && <DidacticsUnitView data={data} facultyId={Number(facultyId)}/>}

                        {!['dashboard', 'field_dashboard'].includes(view) && totalItems > 0 && (
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