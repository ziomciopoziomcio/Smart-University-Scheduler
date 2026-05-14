import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import {ListPagination, ListView} from '@components/Common';
import {type Faculty} from '@api';

interface ScheduleEmployeeFacultyViewProps {
    data: Faculty[];
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function ScheduleEmployeeFacultyView({
                                                data,
                                                page,
                                                pageSize,
                                                totalItems,
                                                onPageChange,
                                                onPageSizeChange
                                            }: ScheduleEmployeeFacultyViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<Faculty>
                items={data}
                icon={AccountBalanceIcon}
                getTitle={(item) => item.faculty_short || item.faculty_name}
                titleWidth="250px"
                columns={[
                    {
                        render: (item) => item.faculty_name || '—',
                        variant: 'secondary',
                        width: '400px'
                    },
                    {
                        render: (item) =>
                            intl.formatMessage(
                                {
                                    id: 'plans.lecturerPlan.departmentSelect.lecturersCountValue',
                                    defaultMessage: '{count, plural, one {# lecturer} other {# lecturers}}'
                                },
                                {count: item.lecturers_count ?? 0}
                            ),
                        variant: 'secondary',
                        width: '180px'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/schedules/lecturers/faculty/${item.id}/unit`);
                }}
                emptyMessage={intl.formatMessage({
                    id: 'facilities.common.noData',
                    defaultMessage: 'No data to display.'
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