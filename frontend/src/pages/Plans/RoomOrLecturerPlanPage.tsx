import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.
export default function RoomOrLecturerPlanPage() {
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
                        Wybierz typ planu
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/plans/rooms/campus')}
                            sx={{borderRadius: '12px', px: 3}}
                        >
                            Plan sal
                        </Button>

                        <Button
                            variant="outlined"
                            disabled
                            sx={{borderRadius: '12px', px: 3}}
                        >
                            Plan wykładowców
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}