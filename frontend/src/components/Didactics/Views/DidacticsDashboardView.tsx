import {Box} from '@mui/material';
import {AccountTree, AutoStories} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {TileView} from '@components/Common';
import {useIntl} from "react-intl";

export function DidacticsDashboardView() {
    const navigate = useNavigate();
    const intl = useIntl();
    const options = [
        {
            id: 'fields',
            title: intl.formatMessage({id: 'didactics.dashboard.fieldsTitle'}),
            description: intl.formatMessage({id: 'didactics.dashboard.fieldsDesc'}),
            icon: AccountTree,
            path: '/didactics/fields'
        },
        {
            id: 'courses',
            title: intl.formatMessage({id: 'didactics.dashboard.coursesTitle'}),
            description: intl.formatMessage({id: 'didactics.dashboard.coursesDesc'}),
            icon: AutoStories,
            path: '/didactics/courses'
        }
    ];

    return (
        <Box sx={{width: '100%'}}>
            <TileView
                items={options}
                getIcon={(item) => item.icon}
                getTitle={(item) => item.title}
                getSubtitle={(item) => item.description}
                onItemClick={(item) => navigate(item.path)}
                variant="flat"
                iconSize={58}
                hideAdd
                hideMenu
            />

        </Box>
    );
}