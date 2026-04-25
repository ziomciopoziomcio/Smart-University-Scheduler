import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import ClassIcon from '@mui/icons-material/Class';

import {ListPagination, ListView} from '@components/Common';
import {type StudyPlanSpecializationSummary} from '../../../../mocks/studyPlanMajorsMock.tsx';

interface ScheduleStudentMajorViewProps {
    data: StudyPlanSpecializationSummary[];
    facultyId: number;
    fieldOfStudyId: number;
    semesterId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function ScheduleStudentMajorView({
                                             data,
                                             facultyId,
                                             fieldOfStudyId,
                                             semesterId,
                                             page,
                                             pageSize,
                                             totalItems,
                                             onPageChange,
                                             onPageSizeChange
                                         }: ScheduleStudentMajorViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<StudyPlanSpecializationSummary>
                items={data}
                icon={ClassIcon}
                getTitle={(item) => item.name}
                titleWidth="400px"
                columns={[
                    {
                        render: (item) =>
                            intl.formatMessage(
                                {
                                    id: 'plans.studentsPlan.studySpecialization.groupsCount',
                                    defaultMessage: '{count, plural, one {# group} other {# groups}}'
                                },
                                {count: item.groups_count ?? 0}
                            ),
                        variant: 'secondary',
                        width: '150px'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(
                        `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/major/${item.id}/group`
                    );
                }}
                emptyMessage={intl.formatMessage({
                    id: 'plans.studentsPlan.studySpecialization.noSpecializations',
                    defaultMessage: 'No specializations to display.'
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