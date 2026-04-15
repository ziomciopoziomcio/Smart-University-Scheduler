import {Box} from '@mui/material';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {scheduleMock} from '../../mocks/scheduleMock';

//TODO: Use real data from backend API (delete mock)
export default function MyPlan() {
    return (
        <Box
            sx={{
                width: '100%',
            }}
        >
            <WeekSchedule entries={scheduleMock}/>
        </Box>
    );
}