import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {lecturerDepartmentsMock, lecturersMock} from '../../../mocks/lecturerPlansMock';

// TODO: AI GENERATED, PLACEHOLDER
export default function LecturerSelectPage() {
    const navigate = useNavigate();
    const params = useParams();
    const departmentId = params.departmentId?.trim();

    const department = useMemo(
        () => lecturerDepartmentsMock.find((item) => item.id === departmentId),
        [departmentId],
    );

    const lecturers = useMemo(() => {
        if (!departmentId) return [];

        return lecturersMock.filter((item) => item.departmentId === departmentId);
    }, [departmentId]);

    return (
        <Box sx={{width: '100%'}}>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    borderRadius: '20px',
                    bgcolor: 'background.paper',
                }}
            >
                <Stack spacing={3}>
                    <Typography sx={{fontSize: '28px', fontWeight: 600}}>
                        Wybierz prowadzącego
                    </Typography>

                    <Typography sx={{fontSize: '18px', color: 'text.secondary'}}>
                        Wybrana jednostka: {department?.name ?? departmentId ?? 'brak parametru'}
                    </Typography>

                    {!departmentId && (
                        <Typography sx={{fontSize: '16px', color: 'error.main'}}>
                            Brakuje parametru departmentId w URL.
                        </Typography>
                    )}

                    {departmentId && lecturers.length === 0 && (
                        <Typography sx={{fontSize: '16px', color: 'error.main'}}>
                            Nie znaleziono prowadzących dla jednostki: {departmentId}
                        </Typography>
                    )}

                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                        {lecturers.map((lecturer) => (
                            <Button
                                key={lecturer.id}
                                variant="contained"
                                onClick={() =>
                                    navigate(
                                        `/plans/lecturers/department/${departmentId}/lecturer/${lecturer.id}`,
                                    )
                                }
                                sx={{borderRadius: '12px', px: 3}}
                            >
                                {lecturer.title} {lecturer.firstName} {lecturer.lastName}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}