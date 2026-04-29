import {Box, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import DateRangeIcon from '@mui/icons-material/DateRange';
import {ListView} from '@components/Common';

interface ProgramSemesterViewProps {
    data: any[];
    facultyId: number;
    fieldId: number;
    programId: number;
}

export function ProgramSemesterView({data, facultyId, fieldId, programId}: ProgramSemesterViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<any>
                items={data}
                icon={DateRangeIcon}
                getTitle={(item) => item.name}
                titleWidth="300px"
                columns={[
                    {
                        // TODO: courses_count - waiting for backend aggregation or calculation in frontend
                        render: (item) => item.courses_count !== undefined
                            ? intl.formatMessage(
                                {id: 'programs.semesters.coursesCount', defaultMessage: '{count} przedmiotów'},
                                {count: item.courses_count}
                            )
                            : '? przedmiotów',
                        variant: 'secondary',
                        width: '150px'
                    },
                    {
                        // TODO: ects_sum - waiting for backend aggregation or calculation in frontend
                        render: (item) => (
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                <Typography variant="body2" fontWeight={600}>
                                    {item.ects_sum !== undefined ? item.ects_sum : '?'} ECTS
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