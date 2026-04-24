import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

import {ListPagination, ListView} from '@components/Common';
import {type StudyField} from '@api';

interface ScheduleStudentFieldViewProps {
    data: StudyField[];
    facultyId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

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

    return (
        <Box>
            <ListView<StudyField>
                items={data}
                icon={AutoStoriesIcon}
                getTitle={(item) => item.field_name}
                titleWidth="400px"
                columns={[
                    {render: (item) => item.study_mode || '—', variant: 'secondary', width: '150px'}
                ]}
                onItemClick={(item) => {
                    navigate(`/schedules/study/faculty/${facultyId}/field/${item.id}/semester`);
                }}
                emptyMessage={intl.formatMessage({id: 'plans.studentsPlan.noFields', defaultMessage: 'Brak kierunków'})}
                hideDividerOnLastItem
            />
            {totalItems > 0 &&
                <ListPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange} pageSizeOptions={[10, 20, 50]}/>}
        </Box>
    );
}