import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

import {ListPagination, ListView} from '@components/Common';
import {type StudyField} from '@api';

import polandFlag from '@assets/flags/poland.svg';
import englandFlag from '@assets/flags/england.svg';

interface ScheduleStudentFieldViewProps {
    data: StudyField[];
    facultyId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

type StudyFieldWithSummary = StudyField & {
    language?: string | null;
    mode?: string | null;
    semesters_count?: number | null;
    specializations_count?: number | null;
};

export function ScheduleStudentFieldView({
                                             data,
                                             facultyId,
                                             page,
                                             pageSize,
                                             totalItems,
                                             onPageChange,
                                             onPageSizeChange
                                         }: ScheduleStudentFieldViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const getLanguageFlag = (language?: string | null) => {
        const normalizedLanguage = language?.toLowerCase();

        let flagSrc: string | null = null;
        let alt = '';

        if (normalizedLanguage === 'polish') {
            flagSrc = polandFlag;
            alt = 'Polish';
        }

        if (normalizedLanguage === 'english') {
            flagSrc = englandFlag;
            alt = 'English';
        }

        if (!flagSrc) {
            return '—';
        }

        return (
            <Box
                component="img"
                src={flagSrc}
                alt={alt}
                sx={{
                    width: 18,
                    height: 18,
                    display: 'block',
                    objectFit: 'contain'
                }}
            />
        );
    };

    const getStudyModeLabel = (item: StudyFieldWithSummary) => {
        switch (item.mode) {
            case 'Full-time':
                return intl.formatMessage({
                    id: 'plans.studentsPlan.studyField.studyMode.fullTime',
                });

            case 'Part-time':
                return intl.formatMessage({
                    id: 'plans.studentsPlan.studyField.studyMode.partTime',
                });

            default:
                return '—';
        }
    };

    const getSemestersLabel = (item: StudyFieldWithSummary) => {
        const count = item.semesters_count ?? 0;

        if (count <= 0) {
            return '—';
        }

        return intl.formatMessage(
            {
                id: 'plans.studentsPlan.studyField.semestersCount',
                defaultMessage: '{count, plural, one {# semester} other {# semesters}}'
            },
            {count}
        );
    };

    const getSpecializationsLabel = (item: StudyFieldWithSummary) => {
        const count = item.specializations_count ?? 0;

        if (count <= 0) {
            return '';
        }

        return intl.formatMessage(
            {
                id: 'plans.studentsPlan.studyField.specializations.count',
                defaultMessage: '{count, plural, one {# specialization} other {# specializations}}'
            },
            {count}
        );
    };

    return (
        <Box>
            <ListView<StudyFieldWithSummary>
                items={data as StudyFieldWithSummary[]}
                getTitle={(item) => item.field_name}
                titleWidth="210px"
                columns={[
                    {
                        render: (item) => getLanguageFlag(item.language),
                        variant: 'secondary',
                        width: '52px',
                        align: 'center'
                    },
                    {
                        render: getStudyModeLabel,
                        variant: 'secondary',
                        width: '120px'
                    },
                    {
                        render: getSemestersLabel,
                        variant: 'secondary',
                        width: '130px'
                    },
                    {
                        render: getSpecializationsLabel,
                        variant: 'secondary',
                        width: '160px'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/schedules/study/faculty/${facultyId}/field/${item.id}/semester`);
                }}
                emptyMessage={intl.formatMessage({
                    id: 'plans.studentsPlan.noFields',
                    defaultMessage: 'No fields of study to display.'
                })}
                hideDividerOnLastItem
            />

            {totalItems > 0 && (
                <ListPagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    pageSizeOptions={[10, 20, 50]}
                />
            )}
        </Box>
    );
}