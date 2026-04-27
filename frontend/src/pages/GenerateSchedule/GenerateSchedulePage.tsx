import {useMemo, useState, type ElementType} from 'react';
import {useIntl} from 'react-intl';
import {
    Box,
    Button,
    Chip,
    Paper,
    Typography,
} from '@mui/material';
import {
    AccessTimeOutlined,
    AutoAwesomeOutlined,
    CheckCircleOutline,
} from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';
import {theme} from "../../theme/theme.ts";

type DashboardTileType = 'success' | 'warning' | 'error' | 'info';

//TODO: WHEN BACKEND WILL BE CREATED, PUT IT IN TYPES AND DELETE MOCKS
//https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/188
enum ScheduleVersionIssue {
    Warning = 'WARNING',
    Critical = 'CRITICAL',
}

interface ScheduleNotification {
    type: ScheduleVersionIssue;
    message: string;
}

interface GenerateScheduleResponse {
    id: number;
    notifications: ScheduleNotification[];
}

interface DashboardTile {
    id: string;
    type: DashboardTileType;
    title: string;
    description: string;
}

const mockedGeneratedScheduleResult: GenerateScheduleResponse = {
    id: 1,
    notifications: [
        {
            type: ScheduleVersionIssue.Warning,
            message: 'Nie udało się przypisać preferowanej sali dla przedmiotu Projektowanie systemów. Wybrano salę zastępczą B-214.',
        },
        {
            type: ScheduleVersionIssue.Warning,
            message: 'Sale laboratoryjne są wykorzystane średnio w 82% dostępnego czasu.',
        },
        {
            type: ScheduleVersionIssue.Critical,
            message: 'Plan został wygenerowany, ale część zajęć nie została przypisana do żadnego terminu.',
        },
    ],
};

const fetchGeneratedSchedule = async (): Promise<GenerateScheduleResponse> => {
    return Promise.resolve(mockedGeneratedScheduleResult);
};

const tileStyles: Record<DashboardTileType, {
    bg: string;
    iconColor: string;
    Icon: ElementType
}> = {
    success: {
        bg: 'rgba(47, 138, 75, 0.12)',
        iconColor: '#2F8A4B',
        Icon: CheckCircleOutline,
    },
    warning: {
        bg: 'rgba(224, 154, 35, 0.20)',
        iconColor: '#A45D00',
        Icon: WarningAmberIcon,
    },
    error: {
        bg: 'rgba(212, 90, 90, 0.18)',
        iconColor: '#A92727',
        Icon: DangerousOutlinedIcon,
    },
    info: {
        bg: 'rgba(78, 109, 158, 0.13)',
        iconColor: '#4E6D9E',
        Icon: AccessTimeOutlined,
    },
};

interface GenerateHeroProps {
    onGenerate: () => Promise<void>;
    isGenerating: boolean;
}

function GenerateHero({onGenerate, isGenerating}: GenerateHeroProps) {
    const intl = useIntl();

    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 3.5, md: 5},
                minHeight: {xs: 240, md: 220},
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 14px 34px rgba(20, 30, 55, 0.07)',
                display: 'flex',
                alignItems: {xs: 'stretch', md: 'center'},
                justifyContent: 'space-between',
                gap: {xs: 3.5, md: 5},
                flexDirection: {xs: 'column', md: 'row'},
            }}
        >
            <Box sx={{display: 'flex', alignItems: 'center', gap: {xs: 6, md: 8}, flex: 1}}>
                <CalendarTodayIcon
                    sx={{
                        fontSize: {xs: 70, md: 92},
                        color: '#A8ADB7',
                        flexShrink: 0,
                    }}
                />

                <Box sx={{textAlign: 'left', width: '100%', maxWidth: 720}}>
                    <Typography
                        sx={{
                            fontSize: {xs: 30, md: 40},
                            fontWeight: 700,
                            color: '#4F4F4F',
                            lineHeight: 1.1,
                            textAlign: 'left',
                        }}
                    >
                        {intl.formatMessage({id: 'generateSchedule.hero.title'})}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 1.4,
                            fontSize: {xs: 15, md: 16.5},
                            color: '#7A7A7A',
                            maxWidth: 700,
                            lineHeight: 1.6,
                            textAlign: 'left',
                        }}
                    >
                        {intl.formatMessage({id: 'generateSchedule.hero.description'})}
                    </Typography>
                </Box>
            </Box>

            <Button
                size="large"
                variant="contained"
                startIcon={<AutoAwesomeOutlined/>}
                onClick={() => void onGenerate()}
                disabled={isGenerating}
                sx={{
                    px: {xs: 4, md: 6},
                    py: {xs: 1.9, md: 2.25},
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontSize: {xs: 17, md: 19},
                    minWidth: {xs: '100%', md: 280},
                    minHeight: 76,
                    background: theme.palette.gradients.brand,
                    color: '#FFFFFF',
                    boxShadow: '0 16px 30px rgba(79, 94, 130, 0.30)',
                    '&:hover': {
                        background: theme.palette.gradients.brand,
                        filter: 'brightness(0.96)',
                        boxShadow: '0 18px 34px rgba(79, 94, 130, 0.36)',
                    },
                    '&.Mui-disabled': {
                        color: '#FFFFFF',
                        opacity: 0.65,
                    },
                }}
            >
                {isGenerating
                    ? intl.formatMessage({id: 'generateSchedule.hero.generating'})
                    : intl.formatMessage({id: 'generateSchedule.hero.button'})}
            </Button>
        </Paper>
    );
}

function getTileTypeFromNotificationType(type: ScheduleVersionIssue): DashboardTileType {
    switch (type) {
        case ScheduleVersionIssue.Critical:
            return 'error';
        case ScheduleVersionIssue.Warning:
            return 'warning';
        default:
            return 'info';
    }
}

function DashboardTileCard({tile}: { tile: DashboardTile }) {
    const style = tileStyles[tile.type];
    const Icon = style.Icon;

    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 1.8, md: 2.1},
                minHeight: 92,
                borderRadius: '18px',
                bgcolor: style.bg,
                display: 'grid',
                gridTemplateColumns: {xs: '54px 1fr', md: '66px 1fr'},
                alignItems: 'center',
                gap: {xs: 1.5, md: 2},
                textAlign: 'left',
                boxShadow: '0 8px 18px rgba(20, 30, 55, 0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(20, 30, 55, 0.07)',
                },
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon
                    sx={{
                        fontSize: {xs: 40, md: 48},
                        color: style.iconColor,
                    }}
                />
            </Box>

            <Box sx={{textAlign: 'left', width: '100%'}}>
                <Typography
                    sx={{
                        fontSize: {xs: 16, md: 17},
                        fontWeight: 800,
                        color: '#3F3F3F',
                        lineHeight: 1.25,
                        textAlign: 'left',
                    }}
                >
                    {tile.title}
                </Typography>

                <Typography
                    sx={{
                        mt: 0.6,
                        fontSize: {xs: 14.2, md: 15},
                        color: '#5F5F5F',
                        lineHeight: 1.45,
                        textAlign: 'left',
                    }}
                >
                    {tile.description}
                </Typography>
            </Box>
        </Paper>
    );
}

interface NotificationsPanelProps {
    notifications: ScheduleNotification[];
    isLoading: boolean;
    hasGeneratedSchedule: boolean;
}

function NotificationsPanel({notifications, isLoading, hasGeneratedSchedule}: NotificationsPanelProps) {
    const intl = useIntl();

    const hasNotifications = notifications.length > 0;

    const hasCriticalIssues = notifications.some(
        (notification) => notification.type === ScheduleVersionIssue.Critical
    );

    const hasWarnings = notifications.some(
        (notification) => notification.type === ScheduleVersionIssue.Warning
    );

    const shouldShowResult = hasGeneratedSchedule || isLoading;

    const tiles = useMemo<DashboardTile[]>(() => {
        if (hasGeneratedSchedule && notifications.length === 0) {
            return [
                {
                    id: 'success',
                    type: 'success',
                    title: intl.formatMessage({id: 'generateSchedule.notifications.successTitle'}),
                    description: intl.formatMessage({id: 'generateSchedule.notifications.successDescription'}),
                },
            ];
        }

        return notifications.map((notification, index) => ({
            id: `notification-${index}`,
            type: getTileTypeFromNotificationType(notification.type),
            title: notification.type === ScheduleVersionIssue.Critical
                ? intl.formatMessage({id: 'generateSchedule.notifications.errorTitle'})
                : intl.formatMessage({id: 'generateSchedule.notifications.warningTitle'}),
            description: notification.message,
        }));
    }, [notifications, intl, hasGeneratedSchedule]);

    const statusConfig = hasCriticalIssues
        ? {
            label: intl.formatMessage({id: 'generateSchedule.notifications.statusErrors'}),
            bgcolor: '#FFE8E8',
            color: '#B14A4A',
        }
        : hasWarnings
            ? {
                label: intl.formatMessage({id: 'generateSchedule.notifications.statusWarnings'}),
                bgcolor: '#FFF1CF',
                color: '#A87316',
            }
            : {
                label: intl.formatMessage({id: 'generateSchedule.notifications.statusSuccess'}),
                bgcolor: '#E7F7EC',
                color: '#3B8F59',
            };

    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 3, md: 4},
                borderRadius: '24px',
                bgcolor: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 14px 34px rgba(20, 30, 55, 0.07)',
                minHeight: shouldShowResult ? 'auto' : 'auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: {xs: 'flex-start', md: 'center'},
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: shouldShowResult ? 3 : 0,
                }}
            >
                <Box sx={{textAlign: 'left'}}>
                    <Typography
                        sx={{
                            fontSize: {xs: 24, md: 28},
                            fontWeight: 700,
                            color: '#4F4F4F',
                            lineHeight: 1.15,
                        }}
                    >
                        {intl.formatMessage({id: 'generateSchedule.notifications.title'})}
                    </Typography>

                    {!shouldShowResult && (
                        <Typography
                            sx={{
                                mt: 1,
                                fontSize: {xs: 14.5, md: 16},
                                color: '#7A7A7A',
                                lineHeight: 1.55,
                                maxWidth: 650,
                            }}
                        >
                            {intl.formatMessage({id: 'generateSchedule.notifications.description'})}
                        </Typography>
                    )}
                </Box>

                {shouldShowResult && (
                    <Chip
                        label={statusConfig.label}
                        sx={{
                            height: 38,
                            px: 1,
                            borderRadius: '14px',
                            bgcolor: statusConfig.bgcolor,
                            color: statusConfig.color,
                            fontWeight: 800,
                            fontSize: 13,
                        }}
                    />
                )}
            </Box>

            {isLoading ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: '18px',
                        bgcolor: '#FBFCFF',
                        border: '1px solid rgba(0,0,0,0.05)',
                    }}
                >
                    <Typography sx={{fontSize: 14, color: '#8A8A8A'}}>
                        {intl.formatMessage({id: 'generateSchedule.notifications.loading'})}
                    </Typography>
                </Paper>
            ) : shouldShowResult ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: hasNotifications ? 1.2 : 0,
                    }}
                >
                    {tiles.map((tile) => (
                        <DashboardTileCard key={tile.id} tile={tile}/>
                    ))}
                </Box>
            ) : null}
        </Paper>
    );
}

export default function GenerateSchedulePage() {
    const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGeneratedSchedule, setHasGeneratedSchedule] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            const result = await fetchGeneratedSchedule();

            setNotifications(result.notifications);
            setHasGeneratedSchedule(true);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <GenerateHero
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
            />

            <NotificationsPanel
                notifications={notifications}
                isLoading={isGenerating}
                hasGeneratedSchedule={hasGeneratedSchedule}
            />
        </Box>
    );
}