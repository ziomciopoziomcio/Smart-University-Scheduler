import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useNavigate, useParams} from 'react-router-dom';

//TODO: It is AI generated page, so it is just a placeholder for now. It should be replaced with real content in the future.
export default function RoomSelectPage() {
    const navigate = useNavigate();
    const {campusId, buildingId} = useParams();

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
                        Wybierz salę
                    </Typography>

                    <Typography sx={{fontSize: '18px', color: 'text.secondary'}}>
                        Kampus: {campusId}
                    </Typography>

                    <Typography sx={{fontSize: '18px', color: 'text.secondary'}}>
                        Budynek: {buildingId}
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            onClick={() =>
                                navigate(`/plans/rooms/campus/${campusId}/building/${buildingId}/room/e5`)
                            }
                            sx={{borderRadius: '12px', px: 3}}
                        >
                            Aula E5
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}