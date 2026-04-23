import {useState, useEffect, useCallback, useMemo} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {ScheduleCampusView, ScheduleBuildingView, ScheduleRoomView} from '@components/Schedule';
import {PageBreadcrumbs, type BreadcrumbItem, SearchBar} from '@components/Common';
import {
    fetchCampuses,
    fetchBuildings,
    fetchRooms,
    getBuilding,
    getCampus,
    type Campus,
    type Building,
    type Room
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

    const [currentCampus, setCurrentCampus] = useState<Campus | null>(null);
    const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);

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
                path: '/plans'
            },
            {
                label: intl.formatMessage({id: 'plans.roomsPlan.title'}),
                path: '/plans/rooms/campus'
            }
        ];

        if (campusId) {
            items.push({
                label: currentCampus ?
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${currentCampus.campus_short}` :
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${campusId}`,
                path: `/plans/rooms/campus/${campusId}/building`
            });
        }

        if (buildingId) {
            items.push({
                label: currentBuilding ?
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${currentBuilding.building_number}` :
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${buildingId}`,
                path: `/plans/rooms/campus/${campusId}/building/${buildingId}/room`
            });
        }
        return items;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const offset = (page - 1) * pageSize;

            if (view === 'campuses') {
                const res = await fetchCampuses();
                setData(res.items);
                setTotalItems(res.items.length);
                setCurrentCampus(null);
                setCurrentBuilding(null);

            } else if (view === 'buildings' && campusId) {
                const [buildingsRes, campusData] = await Promise.all([
                    fetchBuildings(Number(campusId), pageSize, offset),
                    getCampus(Number(campusId))
                ]);
                setData(buildingsRes.items);
                setTotalItems(buildingsRes.total);
                setCurrentCampus(campusData);
                setCurrentBuilding(null);

            } else if (view === 'rooms' && buildingId && campusId) {
                const [roomsRes, campusData, buildingData] = await Promise.all([
                    fetchRooms(Number(buildingId), page, pageSize, {room_name: search.trim() || undefined}),
                    getCampus(Number(campusId)),
                    getBuilding(Number(buildingId))
                ]);
                setData(roomsRes.items);
                setTotalItems(roomsRes.total);
                setCurrentCampus(campusData);
                setCurrentBuilding(buildingData);
            }
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [view, campusId, buildingId, page, pageSize, search]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const filteredData = useMemo(() => {
        if (view === 'campuses' && search) {
            return (data as Campus[]).filter(c =>
                c.campus_short.toLowerCase().includes(search.toLowerCase()) ||
                (c.campus_name || '').toLowerCase().includes(search.toLowerCase())
            );
        }
        return data;
    }, [data, view, search]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'facilities.common.searchPlaceholder'})}
                value={search}
                onChange={setSearch}
            />

            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Box
                sx={{
                    px: {xs: 2, md: 3},
                    py: {xs: 2.5, md: 3},
                    borderRadius: 2,
                    bgcolor: '#FBFCFF',
                    minHeight: 420,
                }}
            >
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        {view === 'campuses' && (
                            <ScheduleCampusView data={filteredData as Campus[]}/>
                        )}
                        {view === 'buildings' && (
                            <ScheduleBuildingView
                                data={filteredData as Building[]}
                                campusId={Number(campusId)}
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
                        {view === 'rooms' && (
                            <ScheduleRoomView
                                data={filteredData as Room[]}
                                campusId={Number(campusId)}
                                buildingId={Number(buildingId)}
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