import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert, Paper} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar, ListPagination} from '@components/Common';
import {
    fetchUnits,
    getFaculty,
    getUnit,
    fetchFaculties,
    fetchEmployees,
    type Faculty,
    type Unit,
} from '@api';

import {
    ScheduleEmployeeFacultyView,
    ScheduleEmployeeUnitView,
    ScheduleEmployeeView
} from '@components/Schedule';

export default function EmployeesSchedulesPage({view}: { view: 'faculties' | 'units' | 'lecturers' }) {
    const {facultyId, unitId} = useParams();
    const intl = useIntl();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

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
    }, [view, facultyId, unitId]);

    const loadData = useCallback(async () => {
        if (view === 'units' && !facultyId) return;
        if (view === 'lecturers' && (!facultyId || !unitId)) return;

        setLoading(true);
        setError(null);
        try {
            if (facultyId && (!currentFaculty || currentFaculty.id !== Number(facultyId))) {
                setCurrentFaculty(await getFaculty(Number(facultyId)));
            }
            if (unitId && (!currentUnit || currentUnit.id !== Number(unitId))) {
                setCurrentUnit(await getUnit(Number(unitId)));
            }

            if (view === 'faculties') {
                const res = await fetchFaculties(page, pageSize, debouncedSearch);
                setData(res.items || res);
                setTotalItems(res.total || 0);
            } else if (view === 'units' && facultyId) {
                const res = await fetchUnits(Number(facultyId), page, pageSize, debouncedSearch);
                setData(res.items || []);
                setTotalItems(res.total || 0);
            } else if (view === 'lecturers' && facultyId && unitId) {
                const res = await fetchEmployees(page, pageSize, debouncedSearch, {
                    faculty_id: Number(facultyId),
                    unit_id: Number(unitId)
                });
                setData(res.items || []);
                setTotalItems(res.total || 0);
            }
        } catch {
            setError('Błąd ładowania danych');
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, unitId, page, pageSize, debouncedSearch]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [{label: intl.formatMessage({id: 'plans.plans'}), path: '/schedules'}];
        items.push({
            label: intl.formatMessage({id: 'plans.lecturerPlan.title'}),
            path: view !== 'faculties' ? '/schedules/lecturers/faculty' : undefined
        });

        if (facultyId && currentFaculty) {
            items.push({
                label: currentFaculty.faculty_short,
                path: view === 'lecturers' ? `/schedules/lecturers/faculty/${facultyId}/unit` : undefined
            });
        }
        if (unitId && currentUnit) {
            items.push({label: currentUnit.unit_short || currentUnit.unit_name});
        }

        return items;
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'facilities.common.searchPlaceholder'})}
                value={search} onChange={setSearch}
            />
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1, mb: 3}}>
                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    // BRAKOWAŁO KEY: Zmusza Reacta do pełnego przeładowania DOM
                    <Box key={`${view}-${facultyId}-${unitId}`}>
                        {view === 'faculties' && data.length > 0 && (
                            <ScheduleEmployeeFacultyView data={data} page={page} pageSize={pageSize}
                                                         totalItems={totalItems} onPageChange={setPage}
                                                         onPageSizeChange={setPageSize}/>
                        )}
                        {view === 'units' && data.length > 0 && (
                            <ScheduleEmployeeUnitView data={data} facultyId={Number(facultyId)} page={page}
                                                      pageSize={pageSize} totalItems={totalItems} onPageChange={setPage}
                                                      onPageSizeChange={setPageSize}/>
                        )}
                        {view === 'lecturers' && data.length > 0 && (
                            <>
                                <ScheduleEmployeeView
                                    data={data}
                                    facultyId={Number(facultyId)}
                                    unitId={Number(unitId)}
                                />
                                {totalItems > 0 && (
                                    <ListPagination
                                        page={page} totalItems={totalItems} pageSize={pageSize}
                                        onPageChange={setPage} onPageSizeChange={(s) => {
                                        setPageSize(s);
                                        setPage(1);
                                    }}
                                    />
                                )}
                            </>
                        )}

                        {!loading && data.length === 0 && (
                            <Alert severity="info">{intl.formatMessage({id: 'facilities.common.noData'})}</Alert>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}