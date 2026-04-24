import {useState, useEffect, useCallback} from 'react';
import {Box, Paper, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, SearchBar} from '@components/Common';
import EmployeeView from '@components/Employees/EmployeeView';
import {type Employee, fetchEmployees} from '@api';

export default function EmployeesPage() {
    const intl = useIntl();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [data, setData] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getBreadcrumbs = () => [
        {label: intl.formatMessage({id: 'academics.employees.employees'}), path: '/employees'}
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {

            const res = await fetchEmployees(100, 0, debouncedSearch);
            setData(res.items);
        } catch (err) {
            const e = err as Error;
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'academics.employees.searchPlaceholder'})}
                value={search}
                onChange={setSearch}
            />
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1}}>
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <EmployeeView data={data} onRefresh={() => {
                        void loadData();
                    }}/>
                )}
            </Paper>
        </Box>
    );
}