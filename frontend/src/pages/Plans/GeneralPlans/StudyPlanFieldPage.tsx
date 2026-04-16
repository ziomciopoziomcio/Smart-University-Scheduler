import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {fieldsOfStudyMock} from '../../../mocks/studyPlansMock';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.
export default function StudyPlanFieldPage() {
    const navigate = useNavigate();
    const {curriculumYearId} = useParams();

    const fields = useMemo(
        () => fieldsOfStudyMock.filter((item) => item.curriculumYearId === curriculumYearId),
        [curriculumYearId],
    );

    return (
        <Box sx={{width: '100%'}}>
            <Paper elevation={0} sx={{p: 4, borderRadius: '20px', bgcolor: 'background.paper'}}>
                <Stack spacing={3}>
                    <Typography sx={{fontSize: '28px', fontWeight: 600}}>
                        Wybierz kierunek
                    </Typography>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        {fields.map((field) => (
                            <Button
                                key={`${field.curriculumYearId}-${field.id}`}
                                variant="contained"
                                onClick={() =>
                                    navigate(`/plans/study/year/${curriculumYearId}/field/${field.id}/semester`)
                                }
                                sx={{borderRadius: '12px', px: 3}}
                            >
                                {field.name}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}