import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, Paper, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from "@components/Common/SearchBar.tsx";
import {fetchFaculties, fetchUnits, getFaculty} from '@api/structures.ts';
import FacultyView from '@components/Structures/FacultyView';
import UnitView from '@components/Structures/UnitView';
import {type Faculty, type Unit} from '@api/types';

interface StructuresPageProps {
    view: 'faculties' | 'units';
}

export default function StructuresPage({view}: StructuresPageProps) {
    const {facultyId} = useParams();
    const intl = useIntl();

    const [dummySearch, setDummySearch] = useState('');

    const [data, setData] = useState<(Faculty | Unit)[]>([]);
    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                const res = await fetchFaculties();
                setData(res.items as Faculty[]);
                setCurrentFaculty(null);
            } else if (facultyId) {
                const [unitsRes, facultyRes] = await Promise.all([
                    fetchUnits(Number(facultyId)),
                    getFaculty(Number(facultyId))
                ]);
                setData(unitsRes.items as Unit[]);
                setCurrentFaculty(facultyRes as Faculty);
            }
        } catch {
            setError(intl.formatMessage({id: 'structures.errors.load'}));
        } finally {
            setLoading(false);
        }
    }, [view, facultyId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={getSearchPlaceholder()}
                value={dummySearch}
                onChange={setDummySearch}
            />
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1}}>
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
                    </>
                )}
            </Paper>
        </Box>
    );
}