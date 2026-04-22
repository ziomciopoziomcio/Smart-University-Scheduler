import {Alert, Box, CircularProgress, Stack, Typography} from '@mui/material';
import Grid from '@mui/material/Grid';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from '@components/Common/SearchBar.tsx';
import {fetchFaculties} from '@api/facilities.ts';
import type {Faculty} from '@api/types';

interface FacultyOption {
    id: number;
    shortName: string;
    description: string;
    path: string;
}

export default function StudyPlanFacultyPage() {
    const navigate = useNavigate();
    const intl = useIntl();

    const [searchValue, setSearchValue] = useState('');
    const [faculties, setFaculties] = useState<FacultyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFaculties = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetchFaculties();

            const mappedFaculties: FacultyOption[] = response.items.map((faculty: Faculty) => ({
                id: faculty.id,
                shortName: faculty.faculty_short,
                description: `${intl.formatMessage({id: 'plans.studentsPlan.checkFaculty'})} ${faculty.faculty_name}`,
                path: `/plans/study/faculty/${faculty.id}/field`,
            }));

            setFaculties(mappedFaculties);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intl]);

    useEffect(() => {
        loadFaculties();
    }, [loadFaculties]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({id: 'plans.studentsPlan.title'}),
                path: '',
            },
        ];
    }, [intl]);

    const filteredFaculties = useMemo(() => {
        const query = searchValue.trim().toLowerCase();

        if (!query) return faculties;

        return faculties.filter((faculty) =>
            faculty.shortName.toLowerCase().includes(query) ||
            faculty.description.toLowerCase().includes(query),
        );
    }, [faculties, searchValue]);

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({
                    id: 'facilities.common.searchPlaceholder',
                })}
                value={searchValue}
                onChange={setSearchValue}
            />

            <PageBreadcrumbs items={breadcrumbs}/>

            <Box
                sx={{
                    px: {xs: 2, md: 3},
                    py: {xs: 2.5, md: 3},
                    borderRadius: 2,
                    bgcolor: '#FBFCFF',
                    minHeight: 140,
                    display: 'flex',
                    alignItems: 'center',
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
                    <Grid
                        container
                        spacing={{xs: 2, md: 3}}
                        sx={{
                            width: '100%',
                            alignItems: 'center',
                        }}
                    >
                        {filteredFaculties.map((faculty) => (
                            <Grid
                                key={faculty.id}
                                size={{xs: 12, md: 4}}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Box
                                    onClick={() => navigate(faculty.path)}
                                    sx={{
                                        width: '100%',
                                        px: {xs: 1, md: 1.5},
                                        py: 1.25,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderRadius: 2,
                                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                                        '&:hover': {
                                            bgcolor: '#F3F5F8',
                                        },
                                        '&:hover .faculty-option-icon': {
                                            color: '#686868',
                                            transform: 'translateX(1px)',
                                        },
                                        '&:hover .faculty-option-title': {
                                            color: '#505050',
                                        },
                                        '&:hover .faculty-option-description': {
                                            color: '#666666',
                                        },
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        alignItems="center"
                                        sx={{width: '100%'}}
                                    >
                                        <Box
                                            className="faculty-option-icon"
                                            sx={{
                                                color: '#7b7b7b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: 56,
                                                flexShrink: 0,
                                                transition: 'color 0.2s ease, transform 0.2s ease',
                                            }}
                                        >
                                            <SchoolOutlinedIcon sx={{fontSize: 55}}/>
                                        </Box>

                                        <Stack spacing={0.4} sx={{flex: 1, minWidth: 0}}>
                                            <Typography
                                                className="faculty-option-title"
                                                sx={{
                                                    fontSize: '18px',
                                                    fontWeight: 500,
                                                    color: '#6b6b6b',
                                                    lineHeight: 1.2,
                                                    transition: 'color 0.2s ease',
                                                }}
                                            >
                                                {faculty.shortName}
                                            </Typography>

                                            <Typography
                                                className="faculty-option-description"
                                                sx={{
                                                    fontSize: '15px',
                                                    color: '#7a7a7a',
                                                    lineHeight: 1.35,
                                                    transition: 'color 0.2s ease',
                                                }}
                                            >
                                                {faculty.description}
                                            </Typography>
                                        </Stack>
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