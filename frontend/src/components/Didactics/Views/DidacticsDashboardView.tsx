import {Box} from '@mui/material';
import {AccountTree, AutoStories} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {TileView} from '@components/Common';
import {useIntl} from 'react-intl';
import {usePermissionStore} from '@store/usePermissionStore';
import {SIDEBAR_PERMISSIONS} from '@constants/permissions';

export function DidacticsDashboardView() {
    const navigate = useNavigate();
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const {STUDY_FIELDS_BASE, STUDY_FIELDS_INNER, COURSES} =
        SIDEBAR_PERMISSIONS.DIDACTICS;

    const canViewStudyFields =
        hasAnyPermission(STUDY_FIELDS_BASE)
        && hasAnyPermission(STUDY_FIELDS_INNER);

    const canViewCourses = hasAnyPermission(COURSES);

    const options = [
        {
            id: 'fields',
            title: intl.formatMessage({id: 'didactics.dashboard.fieldsTitle'}),
            description: intl.formatMessage({id: 'didactics.dashboard.fieldsDesc'}),
            icon: AccountTree,
            path: '/didactics/fields',
            canView: canViewStudyFields,
        },
        {
            id: 'courses',
            title: intl.formatMessage({id: 'didactics.dashboard.coursesTitle'}),
            description: intl.formatMessage({id: 'didactics.dashboard.coursesDesc'}),
            icon: AutoStories,
            path: '/didactics/courses',
            canView: canViewCourses,
        },
    ].filter((option) => option.canView);

    return (
        <Box sx={{width: '100%'}}>
            <TileView
                items={options}
                getIcon={(item) => item.icon}
                getTitle={(item) => item.title}
                getSubtitle={(item) => item.description}
                onItemClick={(item) => {
                    navigate(item.path);
                }}
                variant="flat"
                iconSize={58}
                stretch
                hideAdd
                hideMenu
            />
        </Box>
    );
}