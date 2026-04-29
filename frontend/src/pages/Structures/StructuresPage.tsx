import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, Paper, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, type BreadcrumbItem, SearchBar, ListPagination} from '@components/Common';
import {FacultyView, UnitView} from '@components/Structures';
import {type Faculty, type Unit, fetchFaculties, fetchUnits, getFaculty} from '@api';

interface StructuresPageProps {
    view: 'faculties' | 'units';
}

export default function StructuresPage({view}: StructuresPageProps) {
    const {facultyId} = useParams();
    const intl = useIntl();

    const [data, setData] = useState<(Faculty | Unit)[]>([]);
    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        setPage(1);
        setSearch('');
        setDebouncedSearch('');
    }, [view, facultyId]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    const getSearchPlaceholder = () => {
        switch (view) {
            case 'faculties':
                return intl.formatMessage({id: 'structures.faculty.searchPlaceholder'});
            case 'units':
                return intl.formatMessage({id: 'structures.unit.searchPlaceholder'});
            default:
                return intl.formatMessage({id: 'facilities.common.searchPlaceholder'});
        }
    };

    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [{
            label: intl.formatMessage({id: 'structures.breadcrumbs.main'}),
            path: '/structures'
        }];

        if (view === 'units' && facultyId) {
            items.push({
                label: currentFaculty ?
                    `${intl.formatMessage({id: 'structures.breadcrumbs.faculty'})} ${currentFaculty.faculty_short}` :
                    `${intl.formatMessage({id: 'structures.breadcrumbs.faculty'})} ${facultyId}`
            });
        }
        return items;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (view === 'faculties') {
                const res = await fetchFaculties(page, pageSize, debouncedSearch);
                setData(res.items as Faculty[]);
                setTotalItems(res.total);
                setCurrentFaculty(null);
            } else if (facultyId) {
                const [unitsRes, facultyRes] = await Promise.all([
                    fetchUnits(Number(facultyId), page, pageSize, debouncedSearch),
                    getFaculty(Number(facultyId))
                ]);
                setData(unitsRes.items as Unit[]);
                setTotalItems(unitsRes.total);
                setCurrentFaculty(facultyRes as Faculty);
            }
        } catch {
            setError(intl.formatMessage({id: 'structures.errors.load'}));
        } finally {
            setLoading(false);
        }
    }, [view, facultyId, page, pageSize, debouncedSearch]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={getSearchPlaceholder()}
                value={search}
                onChange={setSearch}
            />
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1, mb: 3}}>
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        {view === 'faculties' && (
                            <FacultyView
                                data={data as Faculty[]}
                                onRefresh={loadData}
                            />
                        )}
                        {view === 'units' && (
                            <UnitView
                                data={data as Unit[]}
                                facultyId={Number(facultyId)}
                                onRefresh={loadData}
                            />
                        )}

                        {totalItems > 0 && (
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
                    </>
                )}
            </Paper>
        </Box>
    );
}