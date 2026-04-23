import {useNavigate} from 'react-router-dom';
import TileView from '@components/Common/TileView.tsx';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import {type Faculty} from '@api';

interface PlansStudentFacultyViewProps {
    data: Faculty[];
}

export default function PlansStudentFacultyView({data}: PlansStudentFacultyViewProps) {
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
            onItemClick={(item) => navigate(`/plans/study/faculty/${item.id}/field`)}
        />
    );
}