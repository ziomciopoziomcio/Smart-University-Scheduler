import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Box,
    CircularProgress,
} from '@mui/material';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from '@components/Common/SearchBar.tsx';
import ListPagination from '@components/Common/ListPagination.tsx';
import ListView, {type ListColumn} from '@components/Common/ListView.tsx';
import {fetchRooms, getBuilding, getCampus} from '@api/facilities.ts';
import type {Building, Room} from '@api/types';
import {useIntl} from 'react-intl';

// TODO: Search bar fix
export default function RoomSelectPage() {
    const navigate = useNavigate();
    const {campusId, buildingId} = useParams();
    const intl = useIntl();

    const [building, setBuilding] = useState<Building | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [campusName, setCampusName] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dummySearch, setDummySearch] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const numericBuildingId = Number(buildingId);

    const loadData = useCallback(async () => {
        if (!buildingId || Number.isNaN(numericBuildingId)) {
            setError('Invalid building Id');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [buildingResponse, roomsResponse, campusResponse] = await Promise.all([
                getBuilding(numericBuildingId),
                fetchRooms(numericBuildingId, page, pageSize, {
                    room_name: dummySearch.trim() || undefined,
                }),
                getCampus(Number(campusId)),
            ]);

            setBuilding(buildingResponse);
            setRooms(roomsResponse.items);
            setTotalItems(roomsResponse.total);
            setCampusName(campusResponse.campus_short);
        } catch (err: any) {
            setError(err.message ?? 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [buildingId, numericBuildingId, page, pageSize, dummySearch, campusId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setPage(1);
    }, [dummySearch]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        const buildingLabel = building?.building_name?.trim()
            ? building.building_name
            : building?.building_number
                ? `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${building.building_number}`
                : '...';

        return [
            {
                label: intl.formatMessage({id: 'plans.plans', defaultMessage: 'Plany'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({id: 'plans.roomsPlan.title', defaultMessage: 'Plany sal'}),
                path: '/plans/rooms/campus',
            },
            {
                label: campusName,
                path: campusId ? `/plans/rooms/campus/${campusId}/building` : '/plans/rooms/campus',
            },
            {
                label: buildingLabel,
                path:
                    campusId && buildingId
                        ? `/plans/rooms/campus/${campusId}/building/${buildingId}/room`
                        : '/plans/rooms/campus',
            },
        ];
    }, [intl, campusId, buildingId, building, campusName]);

    const formatCapacity = (capacity: number) => {
        if (capacity === 1) return `1 ${intl.formatMessage({id: 'facilities.room.station'})}`;
        return `${capacity} ${intl.formatMessage({id: 'facilities.room.stations'})}`;
    };

    const formatPcAmount = (pcAmount: number) => {
        if (pcAmount === 1) return `1 ${intl.formatMessage({id: 'facilities.room.computer.computer'})}`;
        if (pcAmount % 10 >= 2 && pcAmount % 10 <= 4 && (pcAmount % 100 < 10 || pcAmount % 100 >= 20)) {
            return `${pcAmount} ${intl.formatMessage({id: 'facilities.room.computer.computers'})}`;
        }
        return `${pcAmount} ${intl.formatMessage({id: 'facilities.room.computer.computers2'})}`;
    };

    const columns: ListColumn<Room>[] = [
        {
            render: (item) => formatCapacity(item.room_capacity),
            variant: 'secondary',
            width: 140,
        },
        {
            render: (item) => formatPcAmount(item.pc_amount),
            variant: 'secondary',
            width: 140,
        },
    ];

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({
                    id: 'facilities.common.searchPlaceholder',
                })}
                value={dummySearch}
                onChange={setDummySearch}
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
                        <ListView<Room>
                            items={rooms}
                            getTitle={(item) => item.room_name}
                            titleWidth={220}
                            columns={columns}
                            onItemClick={(item) =>
                                navigate(
                                    `/plans/rooms/campus/${campusId}/building/${buildingId}/room/${item.id}`,
                                )
                            }
                            emptyMessage={intl.formatMessage({
                                id: 'facilities.common.noData',
                            })}
                            hideDividerOnLastItem
                            rowSx={{
                                px: {xs: 1.5, md: 3},
                                py: 2.2,
                            }}
                            titleSx={{
                                minWidth: 120,
                                fontSize: '18px',
                                fontWeight: 500,
                                color: '#111111',
                            }}
                        />

                        <ListPagination
                            page={page}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(value) => {
                                setPageSize(value);
                                setPage(1);
                            }}
                            pageSizeOptions={[5, 10, 20, 50]}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}