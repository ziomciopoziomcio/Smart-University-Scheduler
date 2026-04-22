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
import type {Faculty, Major, StudyField, StudyPlanGroupSummary} from '@api/types';
import {fetchMockStudyPlanSpecializationGroups} from '../../../mocks/studyPlanSpecializationGroupsMock';

// TODO: SWITCH MOCK https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/135

export default function StudyPlanSpecializationGroupPage() {
    const navigate = useNavigate();
    const intl = useIntl();

    const {facultyId, fieldOfStudyId, semesterId, specializationId, blockId} = useParams();

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [field, setField] = useState<StudyField | null>(null);
    const [specialization, setSpecialization] = useState<Major | null>(null);
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
    const numericSpecializationId = specializationId ? Number(specializationId) : null;
    const numericBlockId = blockId ? Number(blockId) : null;

    const loadData = useCallback(async () => {
        if (
            !facultyId ||
            !fieldOfStudyId ||
            !semesterId ||
            !specializationId ||
            Number.isNaN(numericFacultyId) ||
            Number.isNaN(numericFieldOfStudyId) ||
            Number.isNaN(numericSemesterId) ||
            Number.isNaN(Number(specializationId)) ||
            (blockId && Number.isNaN(Number(blockId)))
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
            const requests: Promise<any>[] = [
                getFaculty(numericFacultyId) as Promise<Faculty>,
                getStudyField(numericFieldOfStudyId),
                // fetchGroups(1, 100, { //TODO: IT WORKS BUT I NEED TO MOCK ANYWAY
                //     major: numericSpecializationId,
                // }),
                fetchMockStudyPlanSpecializationGroups(Number(numericSpecializationId)),
                // getMajor(numericSpecializationId), // FOR NOW TODO
            ];

            const [facultyResponse, fieldResponse, groupsResponse] =
                await Promise.all(requests);

            setFaculty(facultyResponse);
            setField(fieldResponse as StudyField);
            setGroups(groupsResponse as StudyPlanGroupSummary[]);

            setSpecialization({
                id: Number(numericSpecializationId),
                study_field: numericFieldOfStudyId,
                major_name: `Specjalizacja ${numericSpecializationId}`,
            });
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
        specializationId,
        blockId,
        numericFacultyId,
        numericFieldOfStudyId,
        numericSemesterId,
        numericSpecializationId,
        numericBlockId,
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
        const semesterLabel = intl.formatMessage(
            {id: 'plans.studentsPlan.studySemester.semesterLabel'},
            {number: numericSemesterId},
        );

        const specializationPath =
            facultyId && fieldOfStudyId && semesterId && specializationId
                ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization`
                : '/plans/study/faculty';

        const blockPath =
            facultyId && fieldOfStudyId && semesterId && specializationId && blockId
                ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${specializationId}/block`
                : facultyId && fieldOfStudyId && semesterId && blockId
                    ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/block`
                    : '/plans/study/faculty';

        const items: BreadcrumbItem[] = [
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
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`,
            },
            {
                label: semesterLabel,
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization`,
            },
            {
                label: specialization?.major_name ?? '...',
                path: specializationPath,
            },
        ];

        if (blockId) {
            items.push({
                label: intl.formatMessage({id: 'plans.studentsPlan.studyBlock.title'}),
                path: blockPath,
            });
        }

        return items;
    }, [
        intl,
        faculty,
        field,
        specialization,
        facultyId,
        fieldOfStudyId,
        semesterId,
        specializationId,
        blockId,
        numericSemesterId,
    ]);

    const columns: ListColumn<StudyPlanGroupSummary>[] = [
        {
            width: 180,
            render: (item) => item.group_code,
            variant: 'secondary',
        },
    ];

    const handleGroupClick = (item: StudyPlanGroupSummary) => {
        navigate(
            `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${specializationId}/group/${item.id}/plan`,
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