import {useState} from 'react';
import {AppBar, Toolbar, Box, Typography, Avatar, Menu, MenuItem, IconButton, ListItemIcon} from '@mui/material';
import {Logout} from '@mui/icons-material';
import {useAuthStore} from '@store/useAuthStore';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';
import {theme} from "../../theme/theme.ts";

export default function Navbar() {
    const intl = useIntl();
    const navigate = useNavigate();

    const {user, logout} = useAuthStore();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleCloseMenu();
        logout();
        navigate('/login');
    };

    const initials = user
        ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
        : '??';

    const role = user?.roles?.join(' | ') || '';

    return (
        <AppBar position="fixed" sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: theme.palette.gradients.brand,
            height: 80,
            justifyContent: 'center',
            boxShadow: 'none',
            borderRadius: 0
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
                        sx={{fontWeight: 'bold', fontSize: 18, lineHeight: 1.1, m: 0}}
                    >
                        {user ? `${user.name} ${user.surname}` : intl.formatMessage({id: 'navbar.guest'})}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{opacity: 0.8, lineHeight: 1, display: 'block', m: 0}}
                    >
                        {role}
                    </Typography>
                </Box>

                <IconButton
                    onClick={handleOpenMenu}
                    sx={{p: 0}}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <Avatar sx={{
                        color: '#ddd',
                        width: 50,
                        height: 50,
                        border: '2px solid white',
                        background: theme.palette.primary.main,
                        cursor: 'pointer'
                    }}>
                        {initials}
                    </Avatar>
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    id="account-menu"
                    open={open}
                    onClose={handleCloseMenu}
                    onClick={handleCloseMenu}
                    transformOrigin={{horizontal: 'right', vertical: 'top'}}
                    anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                    slotProps={{
                        paper: {
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                '&:before': {
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    right: 14,
                                    width: 10,
                                    height: 10,
                                    bgcolor: 'background.paper',
                                    transform: 'translateY(-50%) rotate(45deg)',
                                    zIndex: 0,
                                },
                            },
                        }
                    }}
                >
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <Logout fontSize="small"/>
                        </ListItemIcon>
                        {intl.formatMessage({id: 'navbar.logout', defaultMessage: 'Wyloguj się'})}
                    </MenuItem>

                    {/* TODO: add other options in the future */}

                </Menu>
            </Toolbar>
        </AppBar>
    );
}