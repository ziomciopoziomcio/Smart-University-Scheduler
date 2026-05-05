import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import SchoolIcon from '@mui/icons-material/School';
import {ListView} from '@components/Common';
import {type StudyField} from '@api';

interface ProgramFieldViewProps {
    data: StudyField[];
    facultyId: number;
}

export function ProgramFieldView({data, facultyId}: ProgramFieldViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<StudyField>
                items={data}
                icon={SchoolIcon}
                getTitle={(item) => item.field_name}
                titleWidth="350px"
                columns={[
                    {
                        render: (item) => item.mode || '—',
                        variant: 'secondary',
                        width: '150px'
                    },
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'programs.fields.programsCount', defaultMessage: '{count} roczników'},
                            {count: item.programs_count ?? 0}
                        ),
                        variant: 'secondary',
                        width: '150px',
                        align: 'right'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/programs/faculty/${facultyId}/field/${item.id}`);
                }}
                emptyMessage={intl.formatMessage({id: 'programs.noData'})}
                hideDividerOnLastItem
            />
        </Box>
    );
}