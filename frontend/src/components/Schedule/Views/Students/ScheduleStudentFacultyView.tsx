import {useNavigate} from 'react-router-dom';
import {TileView} from '@components/Common';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import {type Faculty} from '@api';

interface ScheduleStudentFacultyViewProps {
    data: Faculty[];
}

export function ScheduleStudentFacultyView({data}: ScheduleStudentFacultyViewProps) {
    const navigate = useNavigate();

    return (
        <TileView<Faculty>
            items={data}
            icon={SchoolOutlinedIcon}
            variant="flat"
            iconSize={52}
            hideAdd
            hideMenu
            getTitle={(item) => item.faculty_short}
            getSubtitle={(item) => item.faculty_name}
            onItemClick={(item) => navigate(`/schedules/study/faculty/${item.id}/field`)}
        />
    );
}