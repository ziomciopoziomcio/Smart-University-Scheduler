import {Box} from '@mui/material';
import {ClassOutlined, ExtensionOutlined} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {TileView} from '@components/Common';
import {useIntl} from "react-intl";

export function FieldDashboardView() {
    const navigate = useNavigate();
    const {facultyId, fieldId} = useParams();
    const intl = useIntl();

    const options = [
        {
            id: 'majors',
            title: intl.formatMessage({id: 'didactics.fieldDashboard.majorsTitle'}),
            description: intl.formatMessage({id: 'didactics.fieldDashboard.majorsDesc'}),
            icon: ClassOutlined,
            path: `/didactics/fields/faculty/${facultyId}/field/${fieldId}/majors`
        },
        {
            id: 'blocks',
            title: intl.formatMessage({id: 'didactics.fieldDashboard.blocksTitle'}),
            description: intl.formatMessage({id: 'didactics.fieldDashboard.blocksDesc'}),
            icon: ExtensionOutlined,
            path: `/didactics/fields/faculty/${facultyId}/field/${fieldId}/blocks`
        }
    ];

    return (
        <Box sx={{width: '100%', background: "#FFF"}}>
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