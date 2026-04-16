import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Box,
    CircularProgress,
} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from '@components/Common/SearchBar.tsx';
import ListView, {type ListColumn} from '@components/Common/ListView.tsx';
import ListPagination from '@components/Common/ListPagination.tsx';

import {getFaculty} from '@api/structures.ts';
import {getStudyField} from '@api/courses.ts';
import type {Faculty, StudyField, StudyFieldSemesterSummary} from '@api/types';
import {fetchMockStudyFieldSemesters} from '../../../mocks/studyPlanSemesterMock';

// TODO: switch mock to api - SEMESTRY W KIERUNKU WYBOR (https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/136)

export default function StudyPlanSemesterPage() {
    const navigate = useNavigate();
    const intl = useIntl();

    const {facultyId, fieldOfStudyId} = useParams();

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [field, setField] = useState<StudyField | null>(null);
    const [semesters, setSemesters] = useState<StudyFieldSemesterSummary[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const numericFacultyId = Number(facultyId);
    const numericFieldOfStudyId = Number(fieldOfStudyId);

    const loadData = useCallback(async () => {
        if (
            !facultyId ||
            !fieldOfStudyId ||
            Number.isNaN(numericFacultyId) ||
            Number.isNaN(numericFieldOfStudyId)
        ) {
            setError(
                intl.formatMessage({
                    id: 'plans.studentsPlan.studySemester.errors.invalidParams',
                    defaultMessage: 'Invalid parameters.',
                }),
            );
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [facultyResponse, fieldResponse, semestersResponse] = await Promise.all([
                getFaculty(numericFacultyId) as Promise<Faculty>,
                getStudyField(numericFieldOfStudyId),
                fetchMockStudyFieldSemesters(numericFieldOfStudyId),
            ]);

            setFaculty(facultyResponse);
            setField(fieldResponse);
            setSemesters(
                [...semestersResponse].sort(
                    (a, b) => a.semester_number - b.semester_number,
                ),
            );
        } catch (err: any) {
            setError(
                err?.message ??
                intl.formatMessage({
                    id: 'plans.studentsPlan.studySemester.errors.fetchFailed',
                    defaultMessage: 'Failed to fetch semesters.',
                }),
            );
        } finally {
            setLoading(false);
        }
    }, [facultyId, fieldOfStudyId, numericFacultyId, numericFieldOfStudyId, intl]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setPage(1);
    }, [searchValue]);

    const filteredSemesters = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return semesters;

        return semesters.filter((semester) =>
            intl
                .formatMessage(
                    {
                        id: 'plans.studentsPlan.studySemester.semesterLabel',
                        defaultMessage: 'Semester {number}',
                    },
                    {number: semester.semester_number},
                )
                .toLowerCase()
                .includes(query),
        );
    }, [semesters, searchValue, intl]);

    const paginatedSemesters = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filteredSemesters.slice(start, end);
    }, [filteredSemesters, page, pageSize]);

    useEffect(() => {
        setTotalItems(filteredSemesters.length);
    }, [filteredSemesters]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({id: 'plans.studentsPlan.title'}),
                path: '/plans/study/faculty',
            },
            {
                label: faculty?.faculty_short ?? intl.formatMessage({id: 'plans.common.loadingBreadcrumb'}),
                path: facultyId ? `/plans/study/faculty/${facultyId}/field` : '/plans/study/faculty',
            },
            {
                label: field?.field_name ?? intl.formatMessage({id: 'plans.common.loadingBreadcrumb'}),
                path:
                    facultyId && fieldOfStudyId
                        ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`
                        : '/plans/study/faculty',
            },
        ];
    }, [intl, faculty, field, facultyId, fieldOfStudyId]);

    const columns: ListColumn<StudyFieldSemesterSummary>[] = [
        {
            width: 140,
            render: (item) =>
                intl.formatMessage(
                    {
                        id: 'plans.studentsPlan.studySemester.groupsCount',
                        defaultMessage: '{count, plural, one {# group} other {# groups}}',
                    },
                    {count: item.groups_count},
                ),
            variant: 'secondary',
        },
        {
            width: 180,
            render: (item) => {
                if ((item.specializations_count ?? 0) <= 0) return '';
                return intl.formatMessage(
                    {
                        id: 'plans.studentsPlan.studySemester.specializationsCount',
                        defaultMessage: '{count, plural, one {# specialization} other {# specializations}}',
                    },
                    {count: item.specializations_count},
                );
            },
            variant: 'secondary',
        },
        {
            width: 220,
            render: (item) => {
                if ((item.elective_blocks_count ?? 0) <= 0) return '';
                return intl.formatMessage(
                    {
                        id: 'plans.studentsPlan.studySemester.electiveBlocksCount',
                        defaultMessage: '{count, plural, one {# elective block} other {# elective blocks}}',
                    },
                    {count: item.elective_blocks_count},
                );
            },
            variant: 'secondary',
        },
    ];

    const handleSemesterClick = (item: StudyFieldSemesterSummary) => {
        const hasSpecializations = (item.specializations_count ?? 0) > 0;
        const hasElectiveBlocks = (item.elective_blocks_count ?? 0) > 0;

        if (hasSpecializations) {
            navigate(
                `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${item.semester_number}/specialization`,
            );
            return;
        }

        if (hasElectiveBlocks) {
            navigate(
                `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${item.semester_number}/block`,
            );
            return;
        }

        navigate(
            `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${item.semester_number}/group`,
        );
    };

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({
                    id: 'plans.studentsPlan.studySemester.searchPlaceholder',
                    defaultMessage: 'Search semester...',
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
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <ListView<StudyFieldSemesterSummary>
                            items={paginatedSemesters}
                            getTitle={(item) =>
                                intl.formatMessage(
                                    {
                                        id: 'plans.studentsPlan.studySemester.semesterLabel',
                                        defaultMessage: 'Semester {number}',
                                    },
                                    {number: item.semester_number},
                                )
                            }
                            titleWidth={220}
                            columns={columns}
                            onItemClick={handleSemesterClick}
                            emptyMessage={intl.formatMessage({
                                id: 'plans.studentsPlan.studySemester.noSemesters',
                                defaultMessage: 'No semesters to display.',
                            })}
                            hideDividerOnLastItem
                            rowSx={{
                                px: {xs: 1.5, md: 3},
                                py: 2.2,
                            }}
                            titleSx={{
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