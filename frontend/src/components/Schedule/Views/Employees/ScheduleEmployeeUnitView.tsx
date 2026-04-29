import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import GroupsIcon from '@mui/icons-material/Groups';

import {ListPagination, ListView} from '@components/Common';
import {type Unit} from '@api';

interface ScheduleEmployeeUnitViewProps {
    data: Unit[];
    facultyId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function ScheduleEmployeeUnitView({
                                             data,
                                             facultyId,
                                             page,
                                             pageSize,
                                             totalItems,
                                             onPageChange,
                                             onPageSizeChange
                                         }: ScheduleEmployeeUnitViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<Unit>
                items={data}
                icon={GroupsIcon}
                getTitle={(item) => item?.unit_name || '—'}
                titleWidth="400px"
                columns={[
                    {
                        render: (item) => item?.unit_short || '—',
                        variant: 'secondary',
                        width: '150px'
                    },
                    {
                        render: (item) =>
                            intl.formatMessage(
                                {
                                    id: 'plans.lecturerPlan.departmentSelect.lecturersCountValue',
                                    defaultMessage: '{count, plural, one {# pracownik} other {# pracowników}}'
                                },
                                {count: item.lecturers_count ?? 0}
                            ),
                        variant: 'secondary',
                        width: '180px'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/schedules/lecturers/faculty/${facultyId}/unit/${item.id}/lecturer`);
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