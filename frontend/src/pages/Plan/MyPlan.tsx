import {Paper, Breadcrumbs, Link, Typography, Box} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';


//TODO: THIS IS AI GENERATED PAGE ONLY FOR TESTING PURPOSES. REPLACE WITH REAL CONTENT LATER.

export default function MyPlan() {
    return (
        <Box>
            <Paper sx={{p: 1, px: 3, borderRadius: 5, mb: 3, width: 'fit-content'}}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small"/>}>
                    <Link underline="hover" color="inherit" href="/">WEEIA</Link>
                    <Link underline="hover" color="inherit" href="/">Informatyka</Link>
                    <Typography color="text.primary" sx={{fontWeight: 'bold'}}>6 Semestr</Typography>
                </Breadcrumbs>
            </Paper>

            <Paper elevation={3} sx={{p: 4, borderRadius: 4}}>
                <Typography variant="h5" align="center" gutterBottom sx={{fontStyle: 'italic', mb: 4}}>
                    Marzec 2026
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '60px repeat(7, 1fr)',
                    border: '1px solid #e0e0e0'
                }}>
                    <Box sx={{borderBottom: '1px solid #e0e0e0', background: '#fafafa'}}/>
                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day) => (
                        <Box key={day} sx={{
                            p: 1.5,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            borderBottom: '1px solid #e0e0e0',
                            borderLeft: '1px solid #e0e0e0',
                            background: '#fafafa'
                        }}>
                            {day}
                        </Box>
                    ))}

                    <Box sx={{
                        p: 2,
                        textAlign: 'center',
                        borderBottom: '1px solid #e0e0e0',
                        fontSize: '0.75rem',
                        color: 'gray'
                    }}>8:00</Box>
                    <Box sx={{
                        borderBottom: '1px solid #e0e0e0',
                        borderLeft: '1px solid #e0e0e0',
                        p: 0.5,
                        position: 'relative'
                    }}>
                        <Box sx={{
                            background: '#c8e6c9',
                            p: 1,
                            borderRadius: 1,
                            fontSize: '10px',
                            borderLeft: '4px solid #4caf50'
                        }}>
                            PROJEKTOWANIE INTERFEJSÓW
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}