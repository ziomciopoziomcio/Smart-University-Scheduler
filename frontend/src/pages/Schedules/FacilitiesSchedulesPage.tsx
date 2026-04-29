import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert, Paper} from '@mui/material';
import {useIntl} from 'react-intl';

import {ScheduleCampusView, ScheduleBuildingView, ScheduleRoomView} from '@components/Schedule';
import {PageBreadcrumbs, type BreadcrumbItem, SearchBar, ListPagination} from '@components/Common';
import {
    fetchCampuses, fetchBuildings, fetchRooms,
    getBuilding, getCampus, type Campus, type Building, type Room
} from '@api';

interface SchedulesFacilitiesPageProps {
    view: 'campuses' | 'buildings' | 'rooms';
}

export default function SchedulesFacilitiesPage({view}: SchedulesFacilitiesPageProps) {
    const {campusId, buildingId} = useParams();
    const intl = useIntl();

    const [data, setData] = useState<(Campus | Building | Room)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [currentCampus, setCurrentCampus] = useState<Campus | null>(null);
    const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (campusId) getCampus(Number(campusId)).then(setCurrentCampus).catch(console.error);
            else setCurrentCampus(null);

            if (buildingId) getBuilding(Number(buildingId)).then(setCurrentBuilding).catch(console.error);
            else setCurrentBuilding(null);
        };
        void fetchMetadata();
    }, [campusId, buildingId]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (view === 'campuses') {
                const res = await fetchCampuses(page, pageSize, debouncedSearch);
                setData(res.items);
                setTotalItems(res.total);
            } else if (view === 'buildings' && campusId) {
                const res = await fetchBuildings(Number(campusId), page, pageSize, debouncedSearch);
                setData(res.items);
                setTotalItems(res.total);
            } else if (view === 'rooms' && buildingId) {
                const res = await fetchRooms(Number(buildingId), page, pageSize, debouncedSearch);
                setData(res.items);
                setTotalItems(res.total);
            }
        } catch (err: any) {
            setError(err.message || intl.formatMessage({id: 'common.errors.unknown'}));
        } finally {
            setLoading(false);
        }
    }, [view, campusId, buildingId, page, pageSize, debouncedSearch]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [{label: intl.formatMessage({id: 'plans.plans'}), path: '/schedules'}];
        if (['campuses', 'buildings', 'rooms'].includes(view)) {
            items.push({
                label: intl.formatMessage({id: 'plans.roomsPlan.title'}),
                path: view !== 'campuses' ? '/schedules/rooms/campus' : undefined
            });
            if (campusId && currentCampus) items.push({
                label: currentCampus.campus_short,
                path: view !== 'buildings' ? `/schedules/rooms/campus/${campusId}/building` : undefined
            });
            if (buildingId && currentBuilding) items.push({label: currentBuilding.building_number});
        }
        return items;
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar placeholder={intl.formatMessage({id: 'facilities.common.searchPlaceholder'})} value={search}
                       onChange={setSearch}/>
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1, mb: 3}}>
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        {view === 'campuses' && <ScheduleCampusView data={data as Campus[]}/>}
                        {view === 'buildings' &&
                            <ScheduleBuildingView data={data as Building[]} campusId={Number(campusId)} page={page}
                                                  pageSize={pageSize} totalItems={totalItems} onPageChange={setPage}
                                                  onPageSizeChange={(val) => {
                                                      setPageSize(val);
                                                      setPage(1);
                                                  }}/>}
                        {view === 'rooms' && <ScheduleRoomView data={data as Room[]} campusId={Number(campusId)}
                                                               buildingId={Number(buildingId)} page={page}
                                                               pageSize={pageSize} totalItems={totalItems}
                                                               onPageChange={setPage} onPageSizeChange={(val) => {
                            setPageSize(val);
                            setPage(1);
                        }}/>}
                        {view === 'campuses' && totalItems > 0 && (
                            <ListPagination page={page} totalItems={totalItems} pageSize={pageSize}
                                            onPageChange={setPage} onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}/>
                        )}
                    </>
                )}
            </Paper>
        </Box>
    );
}