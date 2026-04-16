import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Alert, Box, CircularProgress, Stack, SvgIcon, Typography} from '@mui/material';
import Grid from '@mui/material/Grid';
import ApartmentIcon from '@assets/icons/buildings.svg?react';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from '@components/Common/SearchBar.tsx';
import {fetchCampuses} from '@api/facilities.ts';
import type {Campus} from '@api/types';

//TODO: Searchbar - fix it when backend will work
export default function CampusSelectPage() {
    const navigate = useNavigate();
    const intl = useIntl();

    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const loadCampuses = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetchCampuses();
            setCampuses(res.items);
        } catch (err: any) {
            setError(err.message ?? 'Failed to fetch campuses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCampuses();
    }, [loadCampuses]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({id: 'plans.roomsPlan.title'}),
                path: '/plans/rooms/campus',
            },
        ];
    }, [intl]);

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'facilities.common.searchPlaceholder'})}
                value={search}
                onChange={setSearch}
            />

            <PageBreadcrumbs items={breadcrumbs}/>

            <Box
                sx={{
                    px: {xs: 2, md: 3},
                    py: {xs: 3, md: 4},
                    borderRadius: 2,
                    bgcolor: '#FBFCFF',
                    minHeight: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {loading && (
                    <Box sx={{display: 'flex', justifyContent: 'center', width: '100%', py: 4}}>
                        <CircularProgress/>
                    </Box>
                )}

                {error && !loading && (
                    <Box sx={{width: '100%'}}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}

                {!loading && !error && (
                    <Grid
                        container
                        spacing={{xs: 3, md: 6}}
                        sx={{
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {campuses.map((campus) => (
                            <Grid
                                key={campus.id}
                                size={{xs: 12, sm: 6, md: 4}}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Box
                                    onClick={() => navigate(`/plans/rooms/campus/${campus.id}/building`)}
                                    sx={{
                                        minWidth: {xs: 220, md: 240},
                                        maxWidth: 280,
                                        px: 3,
                                        py: 3,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 2,
                                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                                        '&:hover': {
                                            bgcolor: '#F3F5F8',
                                        },
                                        '&:hover .campus-option-icon': {
                                            color: '#686868',
                                            transform: 'translateX(1px)',
                                        },
                                        '&:hover .campus-option-title': {
                                            color: '#505050',
                                        },
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Box
                                            className="campus-option-icon"
                                            sx={{
                                                color: '#7b7b7b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                transition: 'color 0.2s ease, transform 0.2s ease',
                                            }}
                                        >
                                            <SvgIcon
                                                component={ApartmentIcon}
                                                inheritViewBox
                                                sx={{fontSize: 52}}
                                            />
                                        </Box>

                                        <Typography
                                            className="campus-option-title"
                                            sx={{
                                                fontSize: '18px',
                                                fontWeight: 500,
                                                color: '#6b6b6b',
                                                lineHeight: 1.2,
                                                transition: 'color 0.2s ease',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {campus.campus_short}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </Box>
    );
}