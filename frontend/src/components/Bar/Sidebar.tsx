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
    PersonOutlined,
    SettingsOutlined,
    ChatBubbleOutline,
    ArrowBack,
    ArrowForward,
    GroupsOutlined,
    InboxOutlined
} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import SidebarClock from './SidebarClock';
import SidebarCalendar from './SidebarCalendar';
import {NavLink} from 'react-router-dom';

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const drawerWidth = open ? 310 : 80;
    const intl = useIntl();

    const menuItems = [
        {id: 'sidebar.myPlan', icon: <PersonOutlined/>, path: '/'},
        {id: 'sidebar.plans', icon: <GroupsOutlined/>, path: '/'},
        {id: 'sidebar.chat', icon: <ChatBubbleOutline/>, path: '/'},
        {id: 'sidebar.suggestions', icon: <InboxOutlined/>, path: '/'},
        {id: 'sidebar.settings', icon: <SettingsOutlined/>, path: '/'},
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
                gap: open ? 1 : 6,
                mb: open ? 0 : 19,
                px: open ? 1 : 0
            }}>
                <SidebarClock open={open}/>
                <SidebarCalendar open={open}/>
            </Box>

            <List sx={{width: '100%', px: open ? 0 : 1}}>
                {menuItems.map((item) => (
                    <ListItem key={item.id} disablePadding
                              sx={{display: 'block', mb: open ? 0.5 : 1.5}}>
                        <NavLink
                            to={item.path}
                            style={({isActive}) => ({
                                textDecoration: 'none',
                                color: isActive ? '#005a8d' : '#555',
                                display: 'block'
                            })}>
                            <ListItemButton
                                sx={{
                                    minHeight: 30,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    borderRadius: '12px',
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 2 : 'auto',
                                        justifyContent: 'center',
                                        color: '#555',
                                        '& svg': {
                                            fontSize: open ? 20 : 25,
                                        }
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>

                                {open && (
                                    <ListItemText
                                        primary={intl.formatMessage({id: item.id})}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                        }}
                                        sx={{opacity: 1}}
                                    />
                                )}
                            </ListItemButton>
                        </NavLink>
                    </ListItem>
                ))}
            </List>

            <Box sx={{mt: 'auto', mb: open ? 1 : 4, width: '100%', display: 'flex', justifyContent: 'center'}}>
                <IconButton
                    onClick={() => {
                        setOpen(!open)
                    }}
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