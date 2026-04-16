import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {lecturerDepartmentsMock} from '../../../mocks/lecturerPlansMock';

//TODO: AI GENERATED, PLACEHOLDER

export default function LecturerDepartmentSelectPage() {
    const navigate = useNavigate();

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
                        Wybierz wydział lub jednostkę
                    </Typography>

                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                        {lecturerDepartmentsMock.map((department) => (
                            <Button
                                key={department.id}
                                variant="contained"
                                onClick={() => navigate(`/plans/lecturers/department/${department.id}/lecturer`)}
                                sx={{borderRadius: '12px', px: 3}}
                            >
                                {department.name}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}