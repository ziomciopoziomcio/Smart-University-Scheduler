import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar} from '@components/Common';
import {
    fetchUnits,
    getFaculty,
    fetchFaculties,
    type Faculty,
    type Unit,
    type CourseInstructor,
    type PaginatedResponse
} from '@api';

import {ScheduleEmployeeFacultyView, ScheduleEmployeeUnitView, ScheduleEmployeeView} from '@components/Schedule';

//https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/183

interface EmployeesSchedulesPageProps {
    view: 'faculties' | 'units' | 'lecturers';
}

export default function EmployeesSchedulesPage({view}: EmployeesSchedulesPageProps) {
    const {facultyId, unitId} = useParams();
    const intl = useIntl();

    const [data, setData] = useState<(Faculty | Unit | CourseInstructor)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        setPage(1);
    }, [search, view]);

    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/schedules'
            },
            {
                label: intl.formatMessage({id: 'plans.lecturerPlan.title', defaultMessage: 'Plany prowadzących'}),
                path: '/schedules/lecturers/faculty'
            }
        ];

        if (facultyId) {
            items.push({
                label: currentFaculty ? (currentFaculty.faculty_short || currentFaculty.faculty_name) : facultyId,
                path: `/schedules/lecturers/faculty/${facultyId}/unit`
            });
        }

        if (unitId) {
            items.push({
                label: currentUnit ? (currentUnit.unit_short || currentUnit.unit_name) : unitId,
                path: `/schedules/lecturers/faculty/${facultyId}/unit/${unitId}/lecturer`
            });
        }
        return items;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const offset = (page - 1) * pageSize;

            if (view === 'faculties') {
                const res = await fetchFaculties(page, pageSize, {faculty_name: search.trim() || undefined});
                setData(res.items || []);
                setTotalItems(res.total || 0);
                setCurrentFaculty(null);
                setCurrentUnit(null);

            } else if (view === 'units' && facultyId) {
                const [unitsRes, facData] = await Promise.all([
                    fetchUnits(Number(facultyId)) as Promise<PaginatedResponse<Unit> | Unit[]>,
                    getFaculty(Number(facultyId)) as Promise<Faculty>
                ]);

                const unitsArray = Array.isArray(unitsRes) ? unitsRes : (unitsRes?.items || []);

                const filteredUnits = search.trim()
                    ? unitsArray.filter(u =>
                        (u.unit_name && u.unit_name.toLowerCase().includes(search.toLowerCase())) ||
                        (u.unit_short && u.unit_short.toLowerCase().includes(search.toLowerCase()))
                    )
                    : unitsArray;

                setData(filteredUnits.slice(offset, offset + pageSize));
                setTotalItems(filteredUnits.length);
                setCurrentFaculty(facData);
                setCurrentUnit(null);

            } else if (view === 'lecturers' && facultyId && unitId) {
                const [unitsRes, facData] = await Promise.all([
                    fetchUnits(Number(facultyId)) as Promise<PaginatedResponse<Unit> | Unit[]>,
                    getFaculty(Number(facultyId)) as Promise<Faculty>
                ]);

                const unitsArray = Array.isArray(unitsRes) ? unitsRes : (unitsRes?.items || []);
                const activeUnit = unitsArray.find(u => String(u.id) === String(unitId)) || null;

                const mockLecturers: CourseInstructor[] = [
                    {id: 1, name: 'Piotr', surname: 'Duch', degree: 'dr inż.'},
                    {id: 2, name: 'Robert', surname: 'Kapturski', degree: 'mgr inż.'},
                    {id: 3, name: 'Anna', surname: 'Nowak', degree: 'dr hab. inż.'},
                ];

                const filteredLecturers = search.trim()
                    ? mockLecturers.filter(l => `${l.name} ${l.surname}`.toLowerCase().includes(search.toLowerCase()))
                    : mockLecturers;

                setData(filteredLecturers.slice(offset, offset + pageSize));
                setTotalItems(filteredLecturers.length);
                setCurrentFaculty(facData);
                setCurrentUnit(activeUnit);
            }
        } catch (err: unknown) {
            setError((err as Error).message ?? 'Nie udało się pobrać danych');
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, unitId, page, pageSize, search]);

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

            <Box sx={{px: {xs: 2, md: 3}, py: {xs: 2.5, md: 3}, borderRadius: 2, bgcolor: '#FBFCFF', minHeight: 420}}>
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        {view === 'faculties' && (
                            <ScheduleEmployeeFacultyView
                                data={data as Faculty[]}
                                page={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(value) => {
                                    setPageSize(value);
                                    setPage(1);
                                }}
                            />
                        )}
                        {view === 'units' && (
                            <ScheduleEmployeeUnitView
                                data={data as Unit[]}
                                facultyId={Number(facultyId)}
                                page={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(val) => {
                                    setPageSize(val);
                                    setPage(1);
                                }}
                            />
                        )}
                        {view === 'lecturers' && (
                            <ScheduleEmployeeView
                                data={data as CourseInstructor[]}
                                facultyId={Number(facultyId)}
                                unitId={Number(unitId)}
                                page={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(val) => {
                                    setPageSize(val);
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