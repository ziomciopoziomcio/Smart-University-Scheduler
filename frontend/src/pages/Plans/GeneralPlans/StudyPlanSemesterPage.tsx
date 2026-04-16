import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {semestersMock} from '../../../mocks/studyPlansMock';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.

export default function StudyPlanSemesterPage() {
    const navigate = useNavigate();
    const {curriculumYearId, fieldOfStudyId} = useParams();

    const semesters = useMemo(
        () =>
            semestersMock.filter(
                (item) =>
                    item.curriculumYearId === curriculumYearId &&
                    item.fieldOfStudyId === fieldOfStudyId,
            ),
        [curriculumYearId, fieldOfStudyId],
    );

    const handleSelectSemester = (semesterId: string, hasSpecializations: boolean, hasElectiveBlocks: boolean) => {
        if (hasSpecializations) {
            navigate(
                `/plans/study/year/${curriculumYearId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization`,
            );
            return;
        }

        if (hasElectiveBlocks) {
            navigate(
                `/plans/study/year/${curriculumYearId}/field/${fieldOfStudyId}/semester/${semesterId}/elective-block`,
            );
            return;
        }

        navigate(
            `/plans/study/year/${curriculumYearId}/field/${fieldOfStudyId}/semester/${semesterId}/plan`,
        );
    };

    return (
        <Box sx={{width: '100%'}}>
            <Paper elevation={0} sx={{p: 4, borderRadius: '20px', bgcolor: 'background.paper'}}>
                <Stack spacing={3}>
                    <Typography sx={{fontSize: '28px', fontWeight: 600}}>
                        Wybierz semestr
                    </Typography>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        {semesters.map((semester) => (
                            <Button
                                key={`${semester.curriculumYearId}-${semester.fieldOfStudyId}-${semester.id}`}
                                variant="contained"
                                onClick={() =>
                                    handleSelectSemester(
                                        semester.id,
                                        semester.hasSpecializations,
                                        semester.hasElectiveBlocks,
                                    )
                                }
                                sx={{borderRadius: '12px', px: 3}}
                            >
                                {semester.name}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}