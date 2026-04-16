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
import {fetchBuildings, getCampus} from '@api/facilities.ts';
import type {Building, Campus} from '@api/types';
import {useIntl} from 'react-intl';

// TODO: Search bar fix
// TODO: Number of rooms
export default function BuildingSelectPage() {
    const navigate = useNavigate();
    const {campusId} = useParams();
    const intl = useIntl();

    const [campus, setCampus] = useState<Campus | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dummySearch, setDummySearch] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const numericCampusId = Number(campusId);

    const loadData = useCallback(async () => {
        if (!campusId || Number.isNaN(numericCampusId)) {
            setError('Invalid campus Id');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const offset = (page - 1) * pageSize;

            const [campusResponse, buildingsResponse] = await Promise.all([
                getCampus(numericCampusId),
                fetchBuildings(numericCampusId, pageSize, offset),
            ]);

            setCampus(campusResponse);
            setBuildings(buildingsResponse.items);
            setTotalItems(buildingsResponse.total);
        } catch (err: any) {
            setError(err.message ?? 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [campusId, numericCampusId, page, pageSize]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
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
                label: campus?.campus_short ?? '...',
                path: campusId ? `/plans/rooms/campus/${campusId}/building` : '/plans/rooms/campus',
            },
        ];
    }, [intl, campus, campusId]);

    const formatRoomsCount = (count?: number | null) => {
        if (count === undefined || count === null) return '';

        return intl.formatMessage(
            {id: 'facilities.building.roomsCount'},
            {count},
        );
    };

    const columns: ListColumn<Building>[] = [
        {
            render: (item) =>
                formatRoomsCount((item as any).rooms_count ?? (item as any).roomsCount),
            variant: 'secondary',
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
                        <ListView<Building>
                            items={buildings}
                            getTitle={(item) =>
                                item.building_name?.trim()
                                    ? item.building_name
                                    : `${
                                        intl.formatMessage({
                                            id: 'facilities.breadcrumbs.building',
                                        })
                                    } ${item.building_number}`
                            }
                            titleWidth={220}
                            columns={columns}
                            onItemClick={(item) =>
                                navigate(`/plans/rooms/campus/${campusId}/building/${item.id}/room`)
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
                                fontWeight: 400,
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