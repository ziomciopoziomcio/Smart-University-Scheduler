import {AppBar, Toolbar, Box, Typography, Avatar} from '@mui/material';

//TODO: TAKE INITIALS FROM STORE
//TODO: TAKE ROLE FROM STORE

export default function Navbar() {
    return (
        <AppBar position="fixed" sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: '#005a8d',
            height: 80,
            justifyContent: 'center',
            boxShadow: 'none'
        }}>
            <Toolbar sx={{justifyContent: 'flex-end', gap: 2}}>
                <Box sx={{
                    textAlign: 'right',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 'bold',
                            fontSize: 18,
                            lineHeight: 1.1,
                            m: 0
                        }}
                    >
                        Jan Kowalski
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.8,
                            lineHeight: 1,
                            display: 'block',
                            m: 0
                        }}
                    >
                        Student
                    </Typography>
                </Box>
                <Avatar sx={{bgcolor: '#ddd', width: 50, height: 50, border: '2px solid white'}}>JK</Avatar>
            </Toolbar>
        </AppBar>
    );
}