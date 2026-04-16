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
import {fetchStudyPlanGroups, getStudyField} from '@api/courses.ts';
import type {Faculty, StudyField, StudyPlanGroupSummary} from '@api/types';
import {fetchMockStudyPlanGroups} from '../../../mocks/studyPlanSemesterGroupsMock';

//TODO: SWITCH MOCK WITH API - wyciaganie grup (https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/137)

export default function StudyPlanSemesterGroupPage() {
    const navigate = useNavigate();
    const intl = useIntl();

    const {facultyId, fieldOfStudyId, semesterId} = useParams();

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [field, setField] = useState<StudyField | null>(null);
    const [groups, setGroups] = useState<StudyPlanGroupSummary[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const numericFacultyId = Number(facultyId);
    const numericFieldOfStudyId = Number(fieldOfStudyId);
    const numericSemesterId = Number(semesterId);

    const loadData = useCallback(async () => {
        if (
            !facultyId ||
            !fieldOfStudyId ||
            !semesterId ||
            Number.isNaN(numericFacultyId) ||
            Number.isNaN(numericFieldOfStudyId) ||
            Number.isNaN(numericSemesterId)
        ) {
            setError(
                intl.formatMessage({
                    id: 'plans.studentsPlan.studyGroup.errors.invalidParams',
                    defaultMessage: 'Invalid parameters.',
                }),
            );
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [facultyResponse, fieldResponse, groupsResponse] = await Promise.all([
                getFaculty(numericFacultyId) as Promise<Faculty>,
                getStudyField(numericFieldOfStudyId),
                // fetchStudyPlanGroups(numericFieldOfStudyId, numericSemesterId),
                fetchMockStudyPlanGroups(numericFieldOfStudyId, numericSemesterId),
            ]);

            setFaculty(facultyResponse);
            setField(fieldResponse);
            setGroups(groupsResponse);
        } catch (err: any) {
            setError(
                err?.message ??
                intl.formatMessage({
                    id: 'plans.studentsPlan.studyGroup.errors.fetchFailed',
                    defaultMessage: 'Failed to fetch groups.',
                }),
            );
        } finally {
            setLoading(false);
        }
    }, [
        facultyId,
        fieldOfStudyId,
        semesterId,
        numericFacultyId,
        numericFieldOfStudyId,
        numericSemesterId,
        intl,
    ]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setPage(1);
    }, [searchValue]);

    const filteredGroups = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return groups;

        return groups.filter((group) =>
            group.group_name.toLowerCase().includes(query) ||
            group.group_code.toLowerCase().includes(query),
        );
    }, [groups, searchValue]);

    const paginatedGroups = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filteredGroups.slice(start, end);
    }, [filteredGroups, page, pageSize]);

    useEffect(() => {
        setTotalItems(filteredGroups.length);
    }, [filteredGroups]);

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
                label: faculty?.faculty_short ?? '...',
                path: facultyId ? `/plans/study/faculty/${facultyId}/field` : '/plans/study/faculty',
            },
            {
                label: field?.field_name ?? '...',
                path:
                    facultyId && fieldOfStudyId
                        ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`
                        : '/plans/study/faculty',
            },
            {
                label: intl.formatMessage(
                    {id: 'plans.studentsPlan.studySemester.semesterLabel'},
                    {number: numericSemesterId},
                ),
                path:
                    facultyId && fieldOfStudyId && semesterId
                        ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group`
                        : '/plans/study/faculty',
            },
        ];
    }, [intl, faculty, field, facultyId, fieldOfStudyId, semesterId, numericSemesterId]);

    const columns: ListColumn<StudyPlanGroupSummary>[] = [
        {
            width: 180,
            render: (item) => item.group_code,
            variant: 'secondary',
        },
    ];

    const handleGroupClick = async (item: StudyPlanGroupSummary) => {
        navigate(
            `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group/${item.id}/plan`,
        );
    };

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({
                    id: 'plans.studentsPlan.studyGroup.searchPlaceholder',
                    defaultMessage: 'Search group...',
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
                    <Box sx={{width: '100%'}}>
                        <ListView<StudyPlanGroupSummary>
                            items={paginatedGroups}
                            getTitle={(item) => item.group_name}
                            titleWidth={240}
                            columns={columns}
                            onItemClick={handleGroupClick}
                            emptyMessage={intl.formatMessage({
                                id: 'plans.studentsPlan.studyGroup.noGroups',
                                defaultMessage: 'No groups to display.',
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