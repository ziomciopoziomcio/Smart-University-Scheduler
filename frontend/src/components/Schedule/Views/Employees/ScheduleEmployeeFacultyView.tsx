import {useNavigate} from 'react-router-dom';

import {TileView} from '@components/Common';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {type Faculty} from '@api';

interface ScheduleEmployeeFacultyViewProps {
    data: Faculty[];
}

export function ScheduleEmployeeFacultyView({data}: ScheduleEmployeeFacultyViewProps) {
    const navigate = useNavigate();
    return (
        <TileView<Faculty>
            items={data}
            icon={AccountBalanceIcon}
            variant="flat"
            iconSize={52}
            hideAdd hideMenu
            getTitle={(item) => item.faculty_short}
            getSubtitle={(item) => item.faculty_name}
            onItemClick={(item) => navigate(`/plans/lecturers/faculty/${item.id}/unit`)}
        />
    );
}