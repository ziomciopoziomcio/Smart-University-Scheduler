import {AppBar, Toolbar, Box, Typography, Avatar} from '@mui/material';
import {useAuthStore} from '@store/useAuthStore';
import {useIntl} from 'react-intl';

//TODO : LOGOUT!!
export default function Navbar() {
    const intl = useIntl();
    const {user} = useAuthStore();
    const initials = user
        ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
        : '??';
    const role = user?.degree || ''; //TODO: Here should be role, but for now we dont have any endpoint/knowledge where to find it

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
                        {user ? `${user.name} ${user.surname}` : intl.formatMessage({id: 'navbar.guest'})}
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
                        {role}
                    </Typography>
                </Box>
                <Avatar sx={{bgcolor: '#ddd', width: 50, height: 50, border: '2px solid white', color: '#005a8d'}}>
                    {initials}
                </Avatar>
            </Toolbar>
        </AppBar>
    );
}