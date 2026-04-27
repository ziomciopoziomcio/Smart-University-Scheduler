import {useMemo} from 'react';
import {useIntl} from 'react-intl';
import {
    Box,
    Chip,
    Paper,
    Typography,
} from '@mui/material';

import {DashboardTileCard, type DashboardTileVariant} from '../Common/Notification';
import {
    getTileTypeFromNotificationType,
    ScheduleVersionIssue,
    type ScheduleNotification,
} from './generateTypes';

const getTileVariantFromNotificationType = (type: ScheduleVersionIssue): DashboardTileVariant => {
    switch (type) {
        case ScheduleVersionIssue.Critical:
            return 'error';
        case ScheduleVersionIssue.Warning:
            return 'warning';
        default:
            return 'info';
    }
};

interface NotificationsPanelProps {
    notifications: ScheduleNotification[];
    isLoading: boolean;
    hasGeneratedSchedule: boolean;
}

export default function NotificationsPanel({
                                               notifications,
                                               isLoading,
                                               hasGeneratedSchedule,
                                           }: NotificationsPanelProps) {
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
                minHeight: 'auto',
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
                    {hasGeneratedSchedule && notifications.length === 0 ? (
                        <DashboardTileCard
                            variant="success"
                            title={intl.formatMessage({id: 'generateSchedule.notifications.successTitle'})}
                            description={intl.formatMessage({id: 'generateSchedule.notifications.successDescription'})}
                        />
                    ) : (
                        notifications.map((notification, index) => (
                            <DashboardTileCard
                                key={`notification-${index}`}
                                variant={getTileVariantFromNotificationType(notification.type)}
                                title={
                                    notification.type === ScheduleVersionIssue.Critical
                                        ? intl.formatMessage({id: 'generateSchedule.notifications.errorTitle'})
                                        : intl.formatMessage({id: 'generateSchedule.notifications.warningTitle'})
                                }
                                description={notification.message}
                            />
                        ))
                    )}
                </Box>
            ) : null}
        </Paper>
    );
}