import {useState} from 'react';
// @ts-expect-error: some internal issue with svgr types, but it works
import backpack_icon from '@assets/icons/backpack.svg?react';
// @ts-expect-error: some internal issue with svgr types, but it works
import building_icon from '@assets/icons/building.svg?react';
// @ts-expect-error: some internal issue with svgr types, but it works
import key_icon from '@assets/icons/key.svg?react';
// @ts-expect-error: some internal issue with svgr types, but it works
import diagram_icon from '@assets/icons/diagram.svg?react';
// @ts-expect-error: some internal issue with svgr types, but it works
import easel_icon from '@assets/icons/easel.svg?react';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import GenerateScheduleIcon from '@mui/icons-material/EditCalendarOutlined';
import {SIDEBAR_PERMISSIONS, type PermissionCode} from '@constants/permissions';
import {usePermissionStore} from '@store/usePermissionStore';

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
    InboxOutlined,
} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import SidebarClock from './SidebarClock';
import SidebarCalendar from './SidebarCalendar';
import {NavLink} from 'react-router-dom';
import {theme} from "../../theme/theme";
import {useAuthStore} from "@store/useAuthStore";
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';

interface SidebarMenuItem {
    id: string;
    icon: React.ReactNode;
    path: string;
    requiredPermissions?: readonly PermissionCode[];
}

const menuConfig: SidebarMenuItem[] = [
    {
        id: 'sidebar.myPlan',
        icon: <PersonOutlined/>,
        path: '/plan',
        requiredPermissions: SIDEBAR_PERMISSIONS.MY_PLAN,
    },
    {
        id: 'sidebar.employees',
        icon: <SvgIcon component={easel_icon} inheritViewBox/>,
        path: '/employees',
        requiredPermissions: SIDEBAR_PERMISSIONS.EMPLOYEES,
    },
    {
        id: 'sidebar.facilities',
        icon: <SvgIcon component={building_icon} inheritViewBox/>,
        path: '/facilities',
        requiredPermissions: SIDEBAR_PERMISSIONS.FACILITIES,
    },
    {
        id: 'sidebar.structures',
        icon: <SvgIcon component={diagram_icon} inheritViewBox/>,
        path: '/structures',
        requiredPermissions: SIDEBAR_PERMISSIONS.STRUCTURES,
    },
    {
        id: 'sidebar.didactics',
        icon: <SchoolOutlinedIcon/>,
        path: '/didactics',
    },
    {
        id: 'sidebar.students',
        icon: <SvgIcon component={backpack_icon} inheritViewBox/>,
        path: '/students',
        requiredPermissions: SIDEBAR_PERMISSIONS.STUDENTS,
    },
    {
        id: 'sidebar.plans',
        icon: <GroupsOutlined/>,
        path: '/schedules',
        requiredPermissions: SIDEBAR_PERMISSIONS.PLANS,
    },
    {
        id: 'sidebar.chat',
        icon: <ChatBubbleOutline/>,
        path: '/chat',
        requiredPermissions: SIDEBAR_PERMISSIONS.CHAT,
    },
    {
        id: 'sidebar.suggestions',
        icon: <InboxOutlined/>,
        path: '/suggestions',
        requiredPermissions: SIDEBAR_PERMISSIONS.SUGGESTIONS,
    },
    {
        id: 'sidebar.permissions',
        icon: <SvgIcon component={key_icon} inheritViewBox/>,
        path: '/roles',
        requiredPermissions: SIDEBAR_PERMISSIONS.PERMISSIONS,
    },
    {
        id: 'sidebar.users',
        icon: <AlternateEmailIcon/>,
        path: '/users',
        requiredPermissions: SIDEBAR_PERMISSIONS.USERS,
    },
    {
        id: 'sidebar.settings',
        icon: <SettingsOutlined/>,
        path: '/settings',
        requiredPermissions: SIDEBAR_PERMISSIONS.SETTINGS,
    },
    {
        id: 'sidebar.generateSchedule',
        icon: <GenerateScheduleIcon/>,
        path: '/generate',
        requiredPermissions: SIDEBAR_PERMISSIONS.GENERATE_SCHEDULE,
    },
];

export function Sidebar() {
    const [open, setOpen] = useState(false);
    const drawerWidth = open ? 310 : 80;
    const intl = useIntl();

    const {user} = useAuthStore();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

const canViewDidactics = () => {
    const {STUDY_FIELDS_BASE, STUDY_FIELDS_INNER, COURSES} =
        SIDEBAR_PERMISSIONS.DIDACTICS;

    return (
        hasAnyPermission(COURSES)
        ||
        (
            hasAnyPermission(STUDY_FIELDS_BASE)
            &&
            hasAnyPermission(STUDY_FIELDS_INNER)
        )
    );
};

const canView = (item: SidebarMenuItem) => {
    if (!user) {
        return false;
    }

    if (item.id === 'sidebar.didactics') {
        return canViewDidactics();
    }

    if (!item.requiredPermissions) {
        return false;
    }

    return hasAnyPermission(item.requiredPermissions);
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
                gap: 2,
                mb: open ? 0 : 2,
                px: open ? 1 : 0
            }}>
                <SidebarClock open={open}/>
                <SidebarCalendar open={open}/>
            </Box>

            <List sx={{width: '100%', px: open ? 0 : 1}}>
                {menuConfig
                    .filter((item) => canView(item))
                    .map((item) => (
                        <ListItem key={item.id} disablePadding sx={{display: 'block', mb: open ? 0.5 : 1.5}}>
                            <NavLink
                                to={item.path}
                                style={{textDecoration: 'none', display: 'block'}}
                            >
                                {({isActive}) => (
                                    <ListItemButton
                                        sx={{
                                            minHeight: 44,
                                            justifyContent: open ? 'initial' : 'center',
                                            px: 2.5,
                                            borderRadius: '12px',
                                            backgroundColor: isActive ? '#FFF' : 'transparent',
                                            color: isActive ? '#045f8d' : '#555',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: open ? 2 : 'auto',
                                                justifyContent: 'center',
                                                color: 'inherit',
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
                                                    fontWeight: isActive ? 600 : 500,
                                                }}
                                            />
                                        )}
                                    </ListItemButton>
                                )}
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