import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {electiveBlocksMock} from '../../../mocks/studyPlansMock';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.
export default function StudyPlanElectiveBlockPage() {
    const navigate = useNavigate();
    const {curriculumYearId, fieldOfStudyId, semesterId, specializationId} = useParams();

    const blocks = useMemo(
        () =>
            electiveBlocksMock.filter(
                (item) =>
                    item.curriculumYearId === curriculumYearId &&
                    item.fieldOfStudyId === fieldOfStudyId &&
                    item.semesterId === semesterId &&
                    item.specializationId === (specializationId ?? null),
            ),
        [curriculumYearId, fieldOfStudyId, semesterId, specializationId],
    );

    return (
        <Box sx={{width: '100%'}}>
            <Paper elevation={0} sx={{p: 4, borderRadius: '20px', bgcolor: 'background.paper'}}>
                <Stack spacing={3}>
                    <Typography sx={{fontSize: '28px', fontWeight: 600}}>
                        Wybierz blok obieralny
                    </Typography>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        {blocks.map((block) => (
                            <Button
                                key={`${block.curriculumYearId}-${block.fieldOfStudyId}-${block.semesterId}-${block.specializationId ?? 'none'}-${block.id}`}
                                variant="contained"
                                onClick={() => {
                                    if (specializationId) {
                                        navigate(
                                            `/plans/study/year/${curriculumYearId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${specializationId}/elective-block/${block.id}/plan`,
                                        );
                                        return;
                                    }

                                    navigate(
                                        `/plans/study/year/${curriculumYearId}/field/${fieldOfStudyId}/semester/${semesterId}/elective-block/${block.id}/plan`,
                                    );
                                }}
                                sx={{borderRadius: '12px', px: 3}}
                            >
                                {block.name}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}