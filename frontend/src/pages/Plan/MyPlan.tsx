import { Box, Typography, Container, Button, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

//TODO: THIS IS AI GENERATED PAGE ONLY FOR TESTING PURPOSES. REPLACE WITH REAL CONTENT LATER.
function MyPlan() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    };

    return (
        <Container maxWidth="md">
            <Box 
                sx={{ 
                    marginTop: 8, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center' 
                }}
            >
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        width: '100%', 
                        textAlign: 'center',
                        borderRadius: 2 
                    }}
                >
                    <Stack spacing={3}>
                        <Typography variant="h3" component="h1" gutterBottom>
                            Witaj w Smart University Scheduler! 🎓
                        </Typography>
                        
                        <Typography variant="body1" color="text.secondary">
                            Zostałeś pomyślnie zalogowany do systemu. 
                            To jest Twój panel główny (Home Page).
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                onClick={handleLogout}
                            >
                                Wyloguj się
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </Container>
    );
}

export default MyPlan;