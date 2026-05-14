import { useNavigate } from 'react-router-dom';
import { Groups } from '@mui/icons-material';
import { ListView } from '@components/Common';
import { type Unit } from '@api';
import { useIntl } from 'react-intl';

interface DidacticsUnitViewProps {
    data: Unit[];
    facultyId: number;
}

export function DidacticsUnitView({ data, facultyId }: DidacticsUnitViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <ListView<Unit>
            items={data || []}
            icon={Groups}
            getTitle={(u) => u.unit_name}
            columns={[{ render: (u) => u.unit_short, variant: 'secondary', width: '150px' }]}
            onItemClick={(u) => navigate(`/didactics/courses/faculty/${facultyId}/unit/${u.id}`)}
            emptyMessage={intl.formatMessage({ id: 'didactics.units.empty' })}
        />
    );
}