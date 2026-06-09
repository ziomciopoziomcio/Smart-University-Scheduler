import {Box} from '@mui/material';
import {ClassOutlined, ExtensionOutlined, StarBorderPurple500Outlined} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {TileView} from '@components/Common';
import {useIntl} from 'react-intl';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

export function FieldDashboardView() {
    const navigate = useNavigate();
    const {facultyId, fieldId} = useParams();
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canViewPrograms = hasAnyPermission([
        PERMISSIONS.STUDY_PROGRAMS_VIEW,
        PERMISSIONS.STUDY_PROGRAM_VIEW,
    ]);

    const canViewMajors = hasAnyPermission([
        PERMISSIONS.MAJORS_VIEW,
        PERMISSIONS.MAJOR_VIEW,
    ]);

    const canViewBlocks = hasAnyPermission([
        PERMISSIONS.ELECTIVE_BLOCKS_VIEW,
        PERMISSIONS.ELECTIVE_BLOCK_VIEW,
    ]);

    const options = [
        {
            id: 'programs',
            title: intl.formatMessage({id: 'didactics.fieldDashboard.programsTitle'}),
            description: intl.formatMessage({id: 'didactics.fieldDashboard.programsDesc'}),
            icon: StarBorderPurple500Outlined,
            path: `/didactics/fields/faculty/${facultyId}/field/${fieldId}/programs`,
            canView: canViewPrograms,
        },
        {
            id: 'majors',
            title: intl.formatMessage({id: 'didactics.fieldDashboard.majorsTitle'}),
            description: intl.formatMessage({id: 'didactics.fieldDashboard.majorsDesc'}),
            icon: ClassOutlined,
            path: `/didactics/fields/faculty/${facultyId}/field/${fieldId}/majors`,
            canView: canViewMajors,
        },
        {
            id: 'blocks',
            title: intl.formatMessage({id: 'didactics.fieldDashboard.blocksTitle'}),
            description: intl.formatMessage({id: 'didactics.fieldDashboard.blocksDesc'}),
            icon: ExtensionOutlined,
            path: `/didactics/fields/faculty/${facultyId}/field/${fieldId}/blocks`,
            canView: canViewBlocks,
        },
    ].filter((option) => option.canView);

    return (
        <Box sx={{width: '100%', background: '#FFF'}}>
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