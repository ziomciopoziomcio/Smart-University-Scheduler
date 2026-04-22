import {Box} from '@mui/material';
// @ts-expect-error: some internal issue with svgr types, but it works
import ApartmentIcon from '@assets/icons/building.svg?react';
// @ts-expect-error: some internal issue with svgr types, but it works
import EaselIcon from '@assets/icons/easel.svg?react';
// @ts-expect-error: some internal issue with svgr types, but it works
import BackpackIcon from '@assets/icons/backpack.svg?react';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import TileView from '@components/Common/TileView.tsx';

export default function ChooseScheduleTypePage() {
    const navigate = useNavigate();
    const intl = useIntl();

    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [{
            label: intl.formatMessage({id: 'plans.plans'}),
            path: '/plans'
        }];
        return items;
    };

    const options = [
        {
            id: 'rooms',
            title: intl.formatMessage({id: 'plans.roomsPlan.title'}),
            description: intl.formatMessage({id: 'plans.roomsPlan.description'}),
            icon: ApartmentIcon,
            path: '/plans/rooms/campus',
        },
        {
            id: 'students',
            title: intl.formatMessage({id: 'plans.studentsPlan.title'}),
            description: intl.formatMessage({id: 'plans.studentsPlan.description'}),
            icon: BackpackIcon,
            path: '/plans/study/faculty',
        },
        {
            id: 'lecturers',
            title: intl.formatMessage({id: 'plans.lecturerPlan.title'}),
            description: intl.formatMessage({id: 'plans.lecturerPlan.description'}),
            icon: EaselIcon,
            path: '/plans/lecturers/faculty',
        }
    ];

    return (
        <Box sx={{width: '100%', gap: 2, flexDirection: 'column', display: 'flex'}}>
            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Box
                sx={{
                    px: {xs: 2, md: 3},
                    py: {xs: 2.5, md: 3},
                    borderRadius: 2,
                    bgcolor: '#FBFCFF',
                    minHeight: 140,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
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
        </Box>
    );
}