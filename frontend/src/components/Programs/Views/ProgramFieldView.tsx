import {Box, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
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
                        render: (item) => (
                            <Box sx={{display: 'flex', gap: 1}}>
                                <Typography variant="body2" color="text.secondary">
                                    {item.degree ? intl.formatMessage({id: `didactics.fields.degrees.${item.degree}`}) : '—'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">•</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.mode ? intl.formatMessage({id: `didactics.fields.modes.${item.mode}`}) : '—'}
                                </Typography>
                            </Box>
                        ),
                        width: '250px'
                    },
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'didactics.fields.majorsCount'},
                            {count: item.specializations_count ?? 0}
                        ),
                        icon: ClassIcon,
                        variant: 'secondary',
                        width: '150px'
                    },
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'programs.fields.programsCount'},
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