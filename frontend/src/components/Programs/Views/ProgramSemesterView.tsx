import {Box, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import DateRangeIcon from '@mui/icons-material/DateRange';
import StarIcon from '@mui/icons-material/Star';
import {ListView} from '@components/Common';

interface SemesterItem {
    id: number;
    name: string;
    courses_count: number;
    ects_sum: number;
}

interface ProgramSemesterViewProps {
    data: SemesterItem[];
    facultyId: number;
    fieldId: number;
    programId: number;
}

export function ProgramSemesterView({data, facultyId, fieldId, programId}: ProgramSemesterViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<SemesterItem>
                items={data}
                icon={DateRangeIcon}
                getTitle={(item) => item.name}
                titleWidth="300px"
                columns={[
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'programs.semesters.coursesCount', defaultMessage: '{count} przedmiotów'},
                            {count: item.courses_count ?? 0}
                        ),
                        variant: 'secondary',
                        width: '150px'
                    },
                    {
                        render: (item) => (
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                <StarIcon sx={{fontSize: 16, color: '#f59e0b'}}/>
                                <Typography variant="body2" fontWeight={600}>
                                    {item.ects_sum ?? 0} ECTS
                                </Typography>
                            </Box>
                        ),
                        width: '120px',
                        align: 'right'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/programs/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${item.id}`);
                }}
                emptyMessage={intl.formatMessage({id: 'programs.noData'})}
                hideDividerOnLastItem
            />
        </Box>
    );
}