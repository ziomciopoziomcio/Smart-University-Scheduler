import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import {ListView, UserAvatar} from '@components/Common';
import {type Employee} from '@api';
import {AccountBalance, Email, Groups} from "@mui/icons-material";

interface ScheduleEmployeeViewProps {
    data: Employee[];
    facultyId: number;
    unitId: number;
}

export function ScheduleEmployeeView({data, facultyId, unitId}: ScheduleEmployeeViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <ListView<Employee>
            items={data}
            getTitle={() => ''}
            titleWidth={0}
            columns={[
                {
                    render: (item) => <UserAvatar name={item.user?.name || '?'} surname={item.user?.surname || '?'}/>,
                    width: '50px'
                },
                // TODO: add degree short mapping
                {
                    render: (item) => {
                        if (!item.user) return '—';
                        return `${item.user.degree || ''} ${item.user.name} ${item.user.surname}`.trim();
                    },
                    width: '200px',
                    variant: 'primary'
                },
                {
                    render: (item) => item.user?.email || '—',
                    icon: Email,
                    variant: 'secondary',
                    width: '250px'
                },
                {
                    render: (item) => item.faculty?.faculty_short || '—',
                    variant: 'secondary',
                    icon: AccountBalance,
                    width: '100px',
                    align: 'center'
                },
                {
                    render: (item) => item.unit?.unit_short || '—',
                    variant: 'secondary',
                    icon: Groups,
                    width: '100px',
                    align: 'center'
                }
            ]}
            onItemClick={(item) => {
                navigate(`/schedules/lecturers/faculty/${facultyId}/unit/${unitId}/lecturer/${item.id}`);
            }}
            emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
            hideDividerOnLastItem
            rowSx={{px: 1, minHeight: 65}}
            titleSx={{display: 'none'}}
        />
    );
}