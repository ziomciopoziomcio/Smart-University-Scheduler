import {useState, useEffect, useCallback} from 'react';
import {Box, Paper, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs from '@components/Common/BreadCrumb.tsx';
import SearchBar from "@components/Common/SearchBar.tsx";
import EmployeeView from '@components/Employees/EmployeeView';
import {type Employee} from '@api/types';
import {fetchEmployees} from '@api/academics';

export default function EmployeesPage() {
    const intl = useIntl();
    const [search, setSearch] = useState('');
    const [data, setData] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getBreadcrumbs = () => [
        {label: 'Pracownicy', path: '/employees'}
    ];

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {

            // TODO: Search
            const res = await fetchEmployees();
            setData(res.items);
        } catch (err) {
            const e = err as Error;
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder="Szukaj pracownika (imię, nazwisko...)"
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