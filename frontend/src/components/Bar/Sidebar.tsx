import {useState} from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    IconButton
} from '@mui/material';
import {
    CalendarToday,
    Person,
    Settings,
    ChatBubbleOutline,
    LightbulbOutline,
    ArrowBack,
    ArrowForward,
    AccessTimeFilled
} from '@mui/icons-material';
import {useIntl} from 'react-intl';

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const drawerWidth = open ? 280 : 80;
    const intl = useIntl();

    const menuItems = [
        {id: 'sidebar.my_plan', icon: <Person/>},
        {id: 'sidebar.plans', icon: <CalendarToday/>},
        {id: 'sidebar.chat', icon: <ChatBubbleOutline/>},
        {id: 'sidebar.suggestions', icon: <LightbulbOutline/>},
        {id: 'sidebar.settings', icon: <Settings/>},
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                transition: 'width 0.3s ease',
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    transition: 'width 0.3s ease',
                    overflowX: 'hidden',
                    bgcolor: '#f0f2f5',
                    borderRight: 'none',
                    pt: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: open ? 'flex-start' : 'center',
                    px: open ? 2 : 0,
                },
            }}
        >
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: open ? 'flex-start' : 'center',
                gap: open ? 2 : 4,
                mt: 2.5,
                mb: 12,
                width: '100%',
                pl: open ? 3 : 0,
                transition: 'all 0.3s ease'
            }}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 4}}>
                    <AccessTimeFilled sx={{fontSize: 24, color: '#333'}}/>
                    {open && (
                        <Typography variant="caption" sx={{fontWeight: 'bold', lineHeight: 1.2, whiteSpace: 'nowrap'}}>
                            {intl.formatDate(new Date(), {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                            <br/>
                            {intl.formatTime(new Date(), {hour: '2-digit', minute: '2-digit'})}
                        </Typography>
                    )}
                </Box>

                <Box sx={{width: '100%', display: 'flex', justifyContent: open ? 'flex-start' : 'center'}}>
                    {open ? (
                        <Box sx={{
                            bgcolor: 'white',
                            p: 1.5,
                            borderRadius: '12px',
                            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                            mr: 3,
                            width: '100%'
                        }}>
                            <Typography variant="caption"
                                        sx={{fontWeight: 'bold', display: 'block', mb: 1, textAlign: 'center'}}>
                                Marzec 2026
                            </Typography>
                            <CalendarToday sx={{fontSize: 20, color: '#ccc', display: 'block', margin: 'auto'}}/>
                        </Box>
                    ) : (
                        <CalendarToday sx={{fontSize: 24, color: '#333'}}/>
                    )}
                </Box>
            </Box>

            <List sx={{width: '100%', px: open ? 0 : 1}}>
                {menuItems.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{display: 'block', mb: 1}}>
                        <ListItemButton
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? 'initial' : 'center',
                                px: 2.5,
                                borderRadius: '12px',
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 3 : 'auto',
                                    justifyContent: 'center',
                                    color: '#555'
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            {open && (
                                <ListItemText
                                    primary={intl.formatMessage({id: item.id})}
                                    sx={{opacity: 1}}
                                />
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box sx={{mt: 'auto', mb: 4, width: '100%', display: 'flex', justifyContent: 'center'}}>
                <IconButton
                    onClick={() => setOpen(!open)}
                    sx={{
                        bgcolor: 'white',
                        boxShadow: '0px 4px 10px rgba(0,0,0,0.05)',
                        '&:hover': {bgcolor: '#fff'}
                    }}
                >
                    {open ? <ArrowBack/> : <ArrowForward/>}
                </IconButton>
            </Box>
        </Drawer>
    );
}