import { useNavigate } from 'react-router-dom';
import { AccountBalance } from '@mui/icons-material';
import { TileView } from '@components/Common';
import { type Faculty } from '@api';
import { useIntl } from 'react-intl';

interface DidacticsFacultyViewProps {
    data: Faculty[];
    basePath: string;
}

export function DidacticsFacultyView({ data, basePath }: DidacticsFacultyViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <TileView
            items={data || []}
            icon={AccountBalance}
            variant="flat"
            iconSize={50}
            getTitle={(f) => f.faculty_short || intl.formatMessage({ id: 'didactics.common.faculty' })}
            getSubtitle={(f) => f.faculty_name}
            onItemClick={(f) => navigate(`${basePath}/${f.id}`)}
            hideAdd
            hideMenu
        />
    );
}