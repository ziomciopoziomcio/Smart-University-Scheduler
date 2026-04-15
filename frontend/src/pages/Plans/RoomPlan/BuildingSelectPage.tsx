import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useNavigate, useParams} from 'react-router-dom';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.
export default function BuildingSelectPage() {
    const navigate = useNavigate();
    const {campusId} = useParams();

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
                        Wybierz budynek
                    </Typography>

                    <Typography sx={{fontSize: '18px', color: 'text.secondary'}}>
                        Wybrany kampus: {campusId}
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            onClick={() => navigate(`/plans/rooms/campus/${campusId}/building/a11/room`)}
                            sx={{borderRadius: '12px', px: 3}}
                        >
                            Budynek A11
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}