import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import PeopleIcon from '@mui/icons-material/People';
import {ListView, ListPagination} from '@components/Common';
import {type StudyPlanGroupSummary} from '@api';

interface ScheduleStudentGroupViewProps {
    data: StudyPlanGroupSummary[];
    facultyId: number;
    fieldOfStudyId: number;
    semesterId: number;
    majorId?: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function ScheduleStudentGroupView({
                                             data,
                                             facultyId,
                                             fieldOfStudyId,
                                             semesterId,
                                             majorId,
                                             page,
                                             pageSize,
                                             totalItems,
                                             onPageChange,
                                             onPageSizeChange
                                         }: ScheduleStudentGroupViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<StudyPlanGroupSummary>
                items={data}
                icon={PeopleIcon}
                getTitle={(item) => item.group_name}
                titleWidth="250px"
                onItemClick={(item) => {
                    if (majorId) {
                        navigate(`/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/major/${majorId}/group/${item.id}/schedule`);
                    } else {
                        navigate(`/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group/${item.id}/schedule`);
                    }
                }}
                emptyMessage={intl.formatMessage({
                    id: 'plans.studentsPlan.studyGroup.noGroups',
                    defaultMessage: 'Brak grup'
                })}
                hideDividerOnLastItem
            />
            {totalItems > 0 &&
                <ListPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange} pageSizeOptions={[10, 20, 50]}/>}
        </Box>
    );
}