import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {curriculumYearsMock} from '../../../mocks/studyPlansMock';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.

export default function StudyPlanYearPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{width: '100%'}}>
            <Paper elevation={0} sx={{p: 4, borderRadius: '20px', bgcolor: 'background.paper'}}>
                <Stack spacing={3}>
                    <Typography sx={{fontSize: '28px', fontWeight: 600}}>
                        Wybierz rok podstawy programowej
                    </Typography>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        {curriculumYearsMock.map((year) => (
                            <Button
                                key={year.id}
                                variant="contained"
                                onClick={() => navigate(`/plans/study/year/${year.id}/field`)}
                                sx={{borderRadius: '12px', px: 3}}
                            >
                                {year.name}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}