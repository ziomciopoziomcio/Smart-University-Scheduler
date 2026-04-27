import {Box, Paper, Typography} from '@mui/material';
import {
    AccessTimeOutlined,
    CheckCircleOutline,
} from '@mui/icons-material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';

import type {
    DashboardTileCardProps,
    DashboardTileStyle,
    DashboardTileVariant,
} from './tileTypes';

const tileStyles: Record<DashboardTileVariant, DashboardTileStyle> = {
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

export default function DashboardTileCard({
                                              title,
                                              description,
                                              variant = 'info',
                                              icon,
                                              backgroundColor,
                                              iconColor,
                                              children,
                                              onClick,
                                              sx,
                                          }: DashboardTileCardProps) {
    const variantStyle = tileStyles[variant];
    const Icon = icon ?? variantStyle.Icon;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: {xs: 1.8, md: 2.1},
                minHeight: 92,
                borderRadius: '18px',
                bgcolor: backgroundColor ?? variantStyle.bg,
                display: 'grid',
                gridTemplateColumns: {xs: '54px 1fr', md: '66px 1fr'},
                alignItems: 'center',
                gap: {xs: 1.5, md: 2},
                textAlign: 'left',
                boxShadow: '0 8px 18px rgba(20, 30, 55, 0.04)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': onClick
                    ? {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px rgba(20, 30, 55, 0.07)',
                    }
                    : undefined,
                ...sx,
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
                        color: iconColor ?? variantStyle.iconColor,
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
                    {title}
                </Typography>

                {description && (
                    <Typography
                        sx={{
                            mt: 0.6,
                            fontSize: {xs: 14.2, md: 15},
                            color: '#5F5F5F',
                            lineHeight: 1.45,
                            textAlign: 'left',
                        }}
                    >
                        {description}
                    </Typography>
                )}

                {children}
            </Box>
        </Paper>
    );
}