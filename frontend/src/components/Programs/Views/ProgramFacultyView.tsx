import { useNavigate } from 'react-router-dom';
import { TileView } from '@components/Common';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { type Faculty } from '@api';

interface ProgramFacultyViewProps {
    data: Faculty[];
}

export function ProgramFacultyView({ data }: ProgramFacultyViewProps) {
    const navigate = useNavigate();

    return (
        <TileView<Faculty>
            items={data}
            icon={AccountBalanceIcon}
            variant="flat"
            iconSize={52}
            hideAdd
            hideMenu
            getTitle={(item) => item.faculty_short || item.faculty_name}
            getSubtitle={(item) => item.faculty_name}
            onItemClick={(item) => {
                navigate(`/programs/faculty/${item.id}`);
            }}
        />
    );
}