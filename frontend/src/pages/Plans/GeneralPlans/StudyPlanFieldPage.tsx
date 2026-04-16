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
import {type IntlShape, useIntl} from 'react-intl';

import {fetchStudyFields} from '@api/courses.ts';
import {getFaculty} from '@api/structures.ts';
import type {Faculty, StudyField} from '@api/types';

// TODO: Visible parameters when backend will be fixed and show more details (https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/130)

const getLanguageFlag = (language: string | null | undefined, intl: IntlShape) => {
    const normalized = language?.trim().toLowerCase();

    if (!normalized) {
        return intl.formatMessage({id: 'plans.common.emptyValue'});
    }
    if (normalized.includes('pol')) return '🇵🇱';
    if (normalized.includes('ang')) return '🇬🇧';
    if (normalized.includes('eng')) return '🇬🇧';

    return language;
};

const getStudyModeLabel = (mode: string | null | undefined, intl: IntlShape) => {
    const normalized = mode?.trim().toLowerCase();

    if (!normalized) {
        return intl.formatMessage({id: 'plans.common.emptyValue'});
    }
    if (normalized.includes('niestac')) {
        return intl.formatMessage({id: 'plans.studentsPlan.studyField.studyMode.partTime'});
    }
    if (normalized.includes('stac')) {
        return intl.formatMessage({id: 'plans.studentsPlan.studyField.studyMode.fullTime'});
    }

    return mode;
};

const getSemestersLabel = (count: number | null | undefined, intl: IntlShape) => {
    if (count === undefined || count === null) {
        return intl.formatMessage({id: 'plans.common.emptyValue'});
    }

    return intl.formatMessage(
        {id: 'plans.studentsPlan.studyField.semestersCount'},
        {count},
    );
};

const getSpecializationsLabel = (count: number | null | undefined, intl: IntlShape) => {
    if (count === undefined || count === null) {
        return intl.formatMessage({id: 'plans.common.emptyValue'});
    }

    if (count === 0) {
        return intl.formatMessage({id: 'plans.studentsPlan.studyField.specializations.none'});
    }

    return intl.formatMessage(
        {id: 'plans.studentsPlan.studyField.specializations.count'},
        {count},
    );
};

export default function StudyPlanFieldPage() {
    const navigate = useNavigate();
    const intl = useIntl();
    const {facultyId} = useParams();

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [fields, setFields] = useState<StudyField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const numericFacultyId = Number(facultyId);

    const loadData = useCallback(async () => {
        if (!facultyId || Number.isNaN(numericFacultyId)) {
            setError(
                intl.formatMessage({
                    id: 'plans.studentsPlan.studyField.errors.invalidFacultyId',
                }),
            );
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [facultyResponse, fieldsResponse] = await Promise.all([
                getFaculty(numericFacultyId) as Promise<Faculty>,
                fetchStudyFields(page, pageSize, {
                    faculty: numericFacultyId,
                    field_name: search.trim() || undefined,
                }),
            ]);

            setFaculty(facultyResponse);
            setFields(fieldsResponse.items);
            setTotalItems(fieldsResponse.total);
        } catch (err: any) {
            setError(
                err.message ??
                intl.formatMessage({
                    id: 'plans.studentsPlan.studyField.errors.fetchFailed',
                }),
            );
        } finally {
            setLoading(false);
        }
    }, [facultyId, numericFacultyId, page, pageSize, search, intl]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
                    id: 'plans.studentsPlan.title',
                }),
                path: '/plans/study/faculty',
            },
            {
                label: faculty?.faculty_short ?? intl.formatMessage({id: 'plans.common.loadingBreadcrumb'}),
                path: facultyId ? `/plans/study/faculty/${facultyId}/field` : '/plans/study/faculty',
            },
        ];
    }, [intl, faculty, facultyId]);

    const columns: ListColumn<StudyField>[] = [
        {
            width: 44,
            align: 'center',
            render: (item) => getLanguageFlag(item.language, intl),
            variant: 'secondary',
        },
        {
            width: 150,
            render: (item) => getStudyModeLabel(item.study_mode, intl),
            variant: 'secondary',
        },
        {
            width: 130,
            render: (item) => getSemestersLabel(item.semesters_count, intl),
            variant: 'secondary',
        },
        {
            width: 150,
            render: (item) => getSpecializationsLabel(item.specializations_count, intl),
            variant: 'secondary',
        },
    ];

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <SearchBar
                placeholder={intl.formatMessage({
                    id: 'facilities.common.searchPlaceholder',
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
                        <ListView<StudyField>
                            items={fields}
                            getTitle={(item) => item.field_name}
                            titleWidth={220}
                            columns={columns}
                            onItemClick={(item) =>
                                navigate(
                                    `/plans/study/faculty/${numericFacultyId}/field/${item.id}/semester`,
                                )
                            }
                            emptyMessage={intl.formatMessage({
                                id: 'plans.studentsPlan.noFields',
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