import {useState} from 'react';
// @ts-ignore
import backpack_icon from '@assets/icons/backpack.svg?react';
// @ts-ignore
import building_icon from '@assets/icons/building.svg?react';
// @ts-ignore
import key_icon from '@assets/icons/key.svg?react';
// @ts-ignore
import diagram_icon from '@assets/icons/diagram.svg?react';
// @ts-ignore
import easel_icon from '@assets/icons/easel.svg?react';

import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    IconButton,
    SvgIcon
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
import {theme} from "../../theme/theme.ts";
import {useAuthStore} from "@store/useAuthStore.ts";

// const allRoles = ['Administrator', 'Schedule Manager', "Dean's office",
//     'Head of unit', 'Instructor', 'Student', 'Administrative Staff', 'Guest'];

interface SidebarMenuItem {
    id: string;
    icon: React.ReactNode;
    path: string;
    allowedRoles?: string[];
}

const menuConfig: SidebarMenuItem[] = [
    {
        id: 'sidebar.myPlan',
        icon: <PersonOutlined/>,
        path: '/', // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.employees', // employees or maybe "staff"?
        icon: <SvgIcon component={easel_icon} inheritViewBox/>,
        path: '/', // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.facilities', // facilities (buildings, rooms, campuses)
        icon: <SvgIcon component={building_icon} inheritViewBox/>,
        path: '/', // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.structures', // structures (units, faculties)
        icon: <SvgIcon component={diagram_icon} inheritViewBox/>,
        path: '/', // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.students', // students
        icon: <SvgIcon component={backpack_icon} inheritViewBox/>,
        path: '/', // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.plans', // plans (study plans, course plans)
        icon: <GroupsOutlined/>,
        path: '/',  // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.chat',
        icon: <ChatBubbleOutline/>,
        path: '/',  // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.suggestions',
        icon: <InboxOutlined/>,
        path: '/',  // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.permissions', // uprawnienia
        icon: <SvgIcon component={key_icon} inheritViewBox/>,
        path: '/', // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
    {
        id: 'sidebar.settings',
        icon: <SettingsOutlined/>,
        path: '/',  // TODO: change to real path and add allowedRoles
        allowedRoles: []
    },
];

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const drawerWidth = open ? 310 : 80;
    const intl = useIntl();

    const { user } = useAuthStore();

    const canView = (allowedRoles?: string[]) => {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        if (!user || !user.roles) return false;
        return user.roles.some((role) => allowedRoles.includes(role));
    };

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
                    background: theme.palette.background.default,
                    borderRight: 'none',
                    pt: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: open ? 'flex-start' : 'center',
                    px: open ? 2 : 0,
                    boxShadow: 'none',
                    overflowY: 'auto',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                },
            }}
        >
            <Box sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: open ? 1 : 3,
                mb: open ? 0 : 2,
                px: open ? 1 : 0
            }}>
                <SidebarClock open={open}/>
                <SidebarCalendar open={open}/>
            </Box>

            <List sx={{width: '100%', px: open ? 0 : 1}}>
                {menuConfig
                    .filter((item) => canView(item.allowedRoles))
                    .map((item) => (
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
                        background: 'white',
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