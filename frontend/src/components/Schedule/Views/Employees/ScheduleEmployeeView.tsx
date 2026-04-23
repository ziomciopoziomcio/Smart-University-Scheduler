import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

import {ListView, ListPagination, UserAvatar} from '@components/Common';
import {type CourseInstructor} from '@api';

interface ScheduleEmployeeViewProps {
    data: CourseInstructor[];
    facultyId: number;
    unitId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function ScheduleEmployeeView({
                                              data,
                                              facultyId,
                                              unitId,
                                              page,
                                              pageSize,
                                              totalItems,
                                              onPageChange,
                                              onPageSizeChange
                                          }: ScheduleEmployeeViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<CourseInstructor>
                items={data}
                getTitle={() => ''}
                titleWidth={0}
                columns={[
                    {
                        render: (item) => <UserAvatar name={item.name} surname={item.surname}/>
                    },
                    {
                        render: (item) => `${item.name || ''} ${item.surname || ''}`.trim() || '—',
                        variant: 'primary',
                        width: 320
                    },
                    {
                        render: (item) => item.degree ?? '—',
                        variant: 'secondary',
                        width: 140
                    },
                ]}
                onItemClick={(item) => navigate(`/schedules/lecturers/faculty/${facultyId}/unit/${unitId}/lecturer/${item.id}`)}
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
                hideDividerOnLastItem rowSx={{px: 1, minHeight: 58}} titleSx={{minWidth: 0, width: 0, p: 0}}
            />
            {totalItems > 0 &&
                <ListPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange} pageSizeOptions={[10, 20, 50]}/>
            }
        </Box>
    );
}