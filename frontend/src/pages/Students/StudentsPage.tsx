import {useState, useEffect, useCallback} from 'react';
import {Box, Paper, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, SearchBar, ListPagination} from '@components/Common';
import StudentView from '@components/Students/StudentView';
import {type Student, fetchStudents} from '@api';

export default function StudentsPage() {
    const intl = useIntl();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [data, setData] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getBreadcrumbs = () => [
        {label: intl.formatMessage({id: "academics.students.students"}), path: '/students'}
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchStudents(page, pageSize, debouncedSearch);
            setData(res.items);
            setTotalItems(res.total);
        } catch (err) {
            const e = err as Error;
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'academics.students.searchPlaceholder'})}
                value={search}
                onChange={setSearch}
            />
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1, mb: 3}}>
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        <StudentView data={data} onRefresh={loadData}/>
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