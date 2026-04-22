import type {ReactNode} from 'react';
import {
    Box,
    Stack,
    SvgIcon,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ApartmentIcon from '@assets/icons/building.svg?react';
import EaselIcon from '@assets/icons/easel.svg?react';
import BackpackIcon from '@assets/icons/backpack.svg?react';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';

interface PlanOption {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    path: string;
}

export default function ChoosePlanPage() {
    const navigate = useNavigate();
    const intl = useIntl();


    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [{
            label: intl.formatMessage({id: 'plans.plans'}),
            path: '/plans'
        }];
        return items;
    };

    const options: PlanOption[] = [
        {
            id: 'rooms',
            title: intl.formatMessage({
                id: 'plans.roomsPlan.title',
            }),
            description:
                intl.formatMessage({
                    id: 'plans.roomsPlan.description',
                }),
            icon: <SvgIcon component={ApartmentIcon} inheritViewBox sx={{fontSize: 55}}/>,
            path: '/plans/rooms/campus',
        },
        {
            id: 'students',
            title: intl.formatMessage({
                id: 'plans.studentsPlan.title',
            }),
            description:
                intl.formatMessage({
                    id: 'plans.studentsPlan.description',
                }),
            icon: <SvgIcon component={BackpackIcon} inheritViewBox sx={{fontSize: 60}}/>,
            path: '/plans/study/faculty',
        },
        {
            id: 'lecturers',
            title: intl.formatMessage({
                id: 'plans.lecturerPlan.title',
            }),
            description:
                intl.formatMessage({
                    id: 'plans.lecturerPlan.description',
                }),
            icon: <SvgIcon component={EaselIcon} inheritViewBox sx={{fontSize: 62}}/>,
            path: '/plans/lecturers/faculty',
        },
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
                <Grid
                    container
                    spacing={{xs: 2, md: 3}}
                    sx={{
                        width: '100%',
                        alignItems: 'center',
                    }}
                >
                    {options.map((option) => (
                        <Grid
                            key={option.id}
                            size={{xs: 12, md: 4}}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Box
                                onClick={() => navigate(option.path)}
                                sx={{
                                    width: '100%',
                                    px: {xs: 1, md: 1.5},
                                    py: 1.25,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: 2,
                                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                                    '&:hover': {
                                        bgcolor: '#F3F5F8',
                                    },
                                    '&:hover .plan-option-icon': {
                                        color: '#686868',
                                        transform: 'translateX(1px)',
                                    },
                                    '&:hover .plan-option-title': {
                                        color: '#505050',
                                    },
                                    '&:hover .plan-option-description': {
                                        color: '#666666',
                                    },
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                    sx={{width: '100%'}}
                                >
                                    <Box
                                        className="plan-option-icon"
                                        sx={{
                                            color: '#7b7b7b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 56,
                                            flexShrink: 0,
                                            transition: 'color 0.2s ease, transform 0.2s ease',
                                        }}
                                    >
                                        {option.icon}
                                    </Box>

                                    <Stack spacing={0.4} sx={{flex: 1, minWidth: 0}}>
                                        <Typography
                                            className="plan-option-title"
                                            sx={{
                                                fontSize: '18px',
                                                fontWeight: 500,
                                                color: '#6b6b6b',
                                                lineHeight: 1.2,
                                                transition: 'color 0.2s ease',
                                            }}
                                        >
                                            {option.title}
                                        </Typography>

                                        <Typography
                                            className="plan-option-description"
                                            sx={{
                                                fontSize: '15px',
                                                color: '#7a7a7a',
                                                lineHeight: 1.35,
                                                transition: 'color 0.2s ease',
                                            }}
                                        >
                                            {option.description}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
}