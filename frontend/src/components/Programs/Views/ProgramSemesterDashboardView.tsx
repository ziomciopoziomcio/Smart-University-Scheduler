import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import {TileView} from '@components/Common';

interface ProgramSemesterDashboardProps {
    facultyId: number;
    fieldId: number;
    programId: number;
    semesterId: number;
}

export function ProgramSemesterDashboardView({
                                                 facultyId,
                                                 fieldId,
                                                 programId,
                                                 semesterId
                                             }: ProgramSemesterDashboardProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    const basePath = `/programs/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${semesterId}`;

    const options = [
        {
            id: 'curriculum',
            title: intl.formatMessage({id: 'programs.dashboard.curriculumTitle', defaultMessage: 'Siatka zajęć'}),
            description: intl.formatMessage({
                id: 'programs.dashboard.curriculumDesc',
                defaultMessage: 'Zarządzaj przedmiotami w tym semestrze'
            }),
            icon: MenuBookIcon,
            path: `${basePath}/curriculum`
        },
        {
            id: 'groups',
            title: intl.formatMessage({id: 'programs.dashboard.groupsTitle', defaultMessage: 'Grupy dziekańskie'}),
            description: intl.formatMessage({
                id: 'programs.dashboard.groupsDesc',
                defaultMessage: 'Zarządzaj grupami i przypisuj studentów'
            }),
            icon: GroupsIcon,
            path: `${basePath}/groups`
        }
    ];

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
                hideAdd
                hideMenu
            />
        </Box>
    );
}