import {Box} from '@mui/material';
import {Group, ToggleOn} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';

import {type Role} from '@api';
import {TileView} from '@components/Common';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface RoleDashboardViewProps {
    role: Role;
}

export function RoleDashboardView({role}: RoleDashboardViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canViewUsers = hasAnyPermission([PERMISSIONS.USERS_VIEW]);
    const canViewPermissions = hasAnyPermission([PERMISSIONS.PERMISSIONS_VIEW]);

    const menuOptions = [
        {
            id: 'users',
            title: intl.formatMessage({id: 'roles.tabs.users'}),
            subtitle: intl.formatMessage({id: 'roles.dashboard.usersDesc'}),
            canView: canViewUsers,
        },
        {
            id: 'permissions',
            title: intl.formatMessage({id: 'roles.tabs.permissions'}),
            subtitle: intl.formatMessage({id: 'roles.dashboard.permissionsDesc'}),
            canView: canViewPermissions,
        },
    ].filter((item) => item.canView);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, width: '100%'}}>
            <TileView
                items={menuOptions}
                variant="flat"
                getIcon={(item) => item.id === 'users' ? Group : ToggleOn}
                getTitle={(item) => item.title}
                getSubtitle={(item) => item.subtitle}
                onItemClick={(item) => {
                    navigate(`/roles/${role.id}/${item.id}`);
                }}
                hideAdd
                hideMenu
            />
        </Box>
    );
}