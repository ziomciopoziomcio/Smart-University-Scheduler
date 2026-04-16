import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {electiveBlocksMock, specializationsMock} from '../../../mocks/studyPlansMock';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.

export default function StudyPlanSpecializationPage() {
    const navigate = useNavigate();
    const {curriculumYearId, fieldOfStudyId, semesterId} = useParams();

    const specializations = useMemo(
        () =>
            specializationsMock.filter(
                (item) =>
                    item.curriculumYearId === curriculumYearId &&
                    item.fieldOfStudyId === fieldOfStudyId &&
                    item.semesterId === semesterId,
            ),
        [curriculumYearId, fieldOfStudyId, semesterId],
    );

    const handleSelectSpecialization = (specializationId: string) => {
        const hasElectiveBlocks = electiveBlocksMock.some(
            (item) =>
                item.curriculumYearId === curriculumYearId &&
                item.fieldOfStudyId === fieldOfStudyId &&
                item.semesterId === semesterId &&
                item.specializationId === specializationId,
        );

        if (hasElectiveBlocks) {
            navigate(
                `/plans/study/year/${curriculumYearId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${specializationId}/elective-block`,
            );
            return;
        }

        navigate(
            `/plans/study/year/${curriculumYearId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${specializationId}/plan`,
        );
    };

    return (
        <Box sx={{width: '100%'}}>
            <Paper elevation={0} sx={{p: 4, borderRadius: '20px', bgcolor: 'background.paper'}}>
                <Stack spacing={3}>
                    <Typography sx={{fontSize: '28px', fontWeight: 600}}>
                        Wybierz specjalizację
                    </Typography>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        {specializations.map((specialization) => (
                            <Button
                                key={`${specialization.curriculumYearId}-${specialization.fieldOfStudyId}-${specialization.semesterId}-${specialization.id}`}
                                variant="contained"
                                onClick={() => handleSelectSpecialization(specialization.id)}
                                sx={{borderRadius: '12px', px: 3}}
                            >
                                {specialization.name}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}