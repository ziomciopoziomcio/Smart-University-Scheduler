import {useState} from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
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
} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import SidebarClock from "./SidebarClock.tsx";
import SidebarCalendar from "./SidebarCalendar.tsx";

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const drawerWidth = open ? 310 : 80;
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
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                mb: open ? 2 : 12,
                px: open ? 1 : 0
            }}>
                <SidebarClock open={open}/>
                <SidebarCalendar open={open}/>
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