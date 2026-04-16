import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Alert,
    Box,
    CircularProgress,
} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from '@components/Common/SearchBar.tsx';
import ListPagination from '@components/Common/ListPagination.tsx';
import ListView, {type ListColumn} from '@components/Common/ListView.tsx';

import {fetchFaculties} from '@api/facilities.ts';
import type {Faculty} from '@api/types';

export default function LecturerFacultySelectPage() {
    const navigate = useNavigate();
    const intl = useIntl();

    const [items, setItems] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetchFaculties(1, 200, {
                ...(search.trim() ? {faculty_name: search.trim()} : {}),
            });

            const sortedItems = [...response.items].sort((a, b) => {
                const shortCompare = a.faculty_short.localeCompare(b.faculty_short, 'pl', {sensitivity: 'base'});
                if (shortCompare !== 0) {
                    return shortCompare;
                }

                return a.faculty_name.localeCompare(b.faculty_name, 'pl', {sensitivity: 'base'});
            });

            setItems(sortedItems);
        } catch (err: any) {
            setError(err.message ?? 'Nie udało się pobrać danych');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: intl.formatMessage({id: 'plans.plans', defaultMessage: 'Plany'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({
                    id: 'plans.lecturerPlan.title',
                    defaultMessage: 'Plany prowadzących',
                }),
                path: '/plans/lecturer-faculties',
            },
        ];
    }, [intl]);

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return items.slice(start, end);
    }, [items, page, pageSize]);

    const columns: ListColumn<Faculty>[] = [
        {
            render: (item) => item.faculty_name,
            variant: 'primary',
            width: 420,
        },
        {
            render: (item) => item.lecturers_count ?? '—',
            variant: 'secondary',
            width: 160,
        },
    ];

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({
                    id: 'plans.lecturerPlan.departmentSelect.searchPlaceholder',
                    defaultMessage: 'Wyszukaj wydział...',
                })}
                value={search}
                onChange={setSearch}
            />

            <PageBreadcrumbs items={breadcrumbs}/>

            <Box
                sx={{
                    px: {xs: 2, md: 3},
                    py: {xs: 2.5, md: 3},
                    borderRadius: 2,
                    bgcolor: '#FBFCFF',
                    minHeight: 420,
                }}
            >
                {loading && (
                    <Box sx={{display: 'flex', justifyContent: 'center', width: '100%', py: 6}}>
                        <CircularProgress/>
                    </Box>
                )}

                {error && !loading && (
                    <Box sx={{width: '100%'}}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}

                {!loading && !error && (
                    <Box sx={{width: '100%'}}>
                        <ListView<Faculty>
                            items={paginatedItems}
                            getTitle={(item) => item.faculty_short}
                            titleWidth={80}
                            columns={columns}
                            onItemClick={(item) =>
                                navigate(`/plans/lecturers/faculty/${item.id}/lecturer`)
                            }
                            emptyMessage={intl.formatMessage({
                                id: 'plans.lecturerPlan.departmentSelect.noData',
                                defaultMessage: 'Brak danych',
                            })}
                            hideDividerOnLastItem
                            rowSx={{
                                px: 1,
                                minHeight: 58,
                            }}
                            titleSx={{
                                fontSize: '15px',
                                fontWeight: 500,
                                color: '#111',
                                minWidth: 50,
                            }}
                        />

                        <ListPagination
                            page={page}
                            pageSize={pageSize}
                            totalItems={items.length}
                            onPageChange={setPage}
                            onPageSizeChange={(value) => {
                                setPageSize(value);
                                setPage(1);
                            }}
                            pageSizeOptions={[10, 20, 50]}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}