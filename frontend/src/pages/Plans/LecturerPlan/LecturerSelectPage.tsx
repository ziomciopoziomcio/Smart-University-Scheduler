import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from '@components/Common/SearchBar.tsx';
import ListPagination from '@components/Common/ListPagination.tsx';
import ListView, {type ListColumn} from '@components/Common/ListView.tsx';

import {getFaculty} from '@api/structures.ts';
import type {CourseInstructor, Faculty} from '@api/types';

// TODO: SWITCH MOCK TO API https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/151
// TODO: TEMPORARY PROFILE PICS ARE FIRST LETTERS

const mockedLecturersByFacultyId: Record<number, CourseInstructor[]> = {
    1: [
        {id: 1, name: 'Piotr', surname: 'Duch', degree: 'Dr inż.'},
        {id: 2, name: 'Robert', surname: 'Kapturski', degree: 'Mgr inż.'},
        {id: 3, name: 'Anna', surname: 'Nowak', degree: 'Dr hab. inż.'},
    ],
    24: [
        {id: 1, name: 'Piotr', surname: 'Duch', degree: 'Dr inż.'},
        {id: 2, name: 'Robert', surname: 'Kapturski', degree: 'Mgr inż.'},
        {id: 4, name: 'Katarzyna', surname: 'Wójcik', degree: 'Dr inż.'},
        {id: 5, name: 'Michał', surname: 'Zalewski', degree: null},
    ],
};

export default function LecturerSelectPage() {
    const navigate = useNavigate();
    const intl = useIntl();
    const {facultyId} = useParams<{ facultyId: string }>();

    const numericFacultyId = Number(facultyId);

    const [allItems, setAllItems] = useState<CourseInstructor[]>([]);
    const [facultyName, setFacultyName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const loadData = async () => {
            if (!numericFacultyId || Number.isNaN(numericFacultyId)) {
                setError(intl.formatMessage({
                    id: 'plans.lecturerPlan.lecturerSelect.errors.invalidFacultyId',
                }));
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const faculty = await getFaculty(numericFacultyId) as Faculty;
                setFacultyName(faculty.faculty_name);

                const mockedData = mockedLecturersByFacultyId[numericFacultyId] ?? [];
                setAllItems(mockedData);
            } catch (err: any) {
                setError(err.message ?? intl.formatMessage({
                    id: 'plans.lecturerPlan.lecturerSelect.errors.fetchFacultyFailed',
                }));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [numericFacultyId]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({
                    id: 'plans.lecturerPlan.title',
                }),
                path: '/plans/lecturers/faculty',
            },
            {
                label: facultyName || facultyId || '...',
                path: ``,
            },
        ];
    }, [intl, facultyId, facultyName]);

    const filteredItems = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return allItems;
        }

        return allItems.filter((item) => {
            const fullName = `${item.name} ${item.surname}`.toLowerCase();
            const degree = (item.degree ?? '').toLowerCase();

            return fullName.includes(normalizedSearch) || degree.includes(normalizedSearch);
        });
    }, [allItems, search]);

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filteredItems.slice(start, end);
    }, [filteredItems, page, pageSize]);

    const columns: ListColumn<CourseInstructor>[] = [
        {
            render: (item) => `${item.name} ${item.surname}`,
            variant: 'primary',
            width: 320,
        },
        {
            render: (item) => item.degree ?? '—',
            variant: 'secondary',
            width: 140,
        },
    ];

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({
                    id: 'plans.lecturerPlan.lecturerSelect.searchPlaceholder',
                })}
                value={search}
                onChange={setSearch}
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
                {error && !loading && (
                    <Box sx={{width: '100%'}}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}

                {!loading && !error && (
                    <Box sx={{width: '100%'}}>
                        <ListView<CourseInstructor>
                            items={paginatedItems}
                            getTitle={() => ''}
                            titleWidth={48}
                            emptyMessage={intl.formatMessage({
                                id: 'plans.lecturerPlan.lecturerSelect.noData',
                            })}
                            columns={[
                                {
                                    render: (item) => (
                                        <Avatar
                                            component="span"
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                fontSize: '12px',
                                                bgcolor: '#DDE8C8',
                                                color: '#3D5A1A',
                                                display: 'inline-flex',
                                            }}
                                        >
                                            {item.name[0]}
                                            {item.surname[0]}
                                        </Avatar>
                                    ),
                                    variant: 'secondary',
                                    width: 48,
                                },
                                ...columns,
                            ]}
                            onItemClick={(item) =>
                                navigate(`/plans/lecturers/faculty/${facultyId}/lecturer/${item.id}`)
                            }
                            hideDividerOnLastItem
                            rowSx={{
                                px: 1,
                                minHeight: 58,
                            }}
                            titleSx={{
                                minWidth: 0,
                                width: 0,
                                p: 0,
                            }}
                        />

                        <ListPagination
                            page={page}
                            pageSize={pageSize}
                            totalItems={filteredItems.length}
                            onPageChange={setPage}
                            onPageSizeChange={(value) => {
                                setPageSize(value);
                                setPage(1);
                            }}
                            pageSizeOptions={[10, 20, 50]}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}