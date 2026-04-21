import {Box} from '@mui/material';
import {Group, ToggleOn} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';
import {type Role} from '@api/types';
import TileView from '@components/Common/TileView.tsx';

interface RoleDashboardViewProps {
    role: Role;
}

export default function RoleDashboardView({role}: RoleDashboardViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const menuOptions = [
        {
            id: 'users',
            title: intl.formatMessage({id: 'roles.tabs.users'}),
            subtitle: intl.formatMessage({id: 'roles.dashboard.usersDesc'})
        },
        {
            id: 'permissions',
            title: intl.formatMessage({id: 'roles.tabs.permissions'}),
            subtitle: intl.formatMessage({id: 'roles.dashboard.permissionsDesc'})
        }
    ];

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, width: '100%'}}>
            <TileView
                items={menuOptions}
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