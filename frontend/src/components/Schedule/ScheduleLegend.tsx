import {Box, Typography} from '@mui/material';
import {useIntl} from 'react-intl';
import type {ScheduleTileVariant} from '@api';
import {getTilePaletteByVariant} from './utils/tileColorUtils';

const legendLabels: Record<ScheduleTileVariant, {labelId: string; fallback: string}> = {
    lecture: {
        labelId: 'schedule.subjectType.lecture',
        fallback: 'Lecture',
    },
    lab: {
        labelId: 'schedule.subjectType.lab',
        fallback: 'Laboratory',
    },
    exercise: {
        labelId: 'schedule.subjectType.exercise',
        fallback: 'Classes',
    },
    project: {
        labelId: 'schedule.subjectType.project',
        fallback: 'Project',
    },
    seminar: {
        labelId: 'schedule.subjectType.seminar',
        fallback: 'Seminar',
    },
};

interface ScheduleLegendProps {
    variant: ScheduleTileVariant | null;
}

export function ScheduleLegend({variant}: ScheduleLegendProps) {
    const {formatMessage} = useIntl();

    if (!variant) {
        return null;
    }

    const palette = getTilePaletteByVariant(variant);
    const label = legendLabels[variant];

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                pointerEvents: 'none',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.2,
                    py: 0.55,
                    borderRadius: '999px',
                    bgcolor: 'rgba(255,255,255,0.82)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 6px 18px rgba(20, 30, 55, 0.08)',
                    backdropFilter: 'blur(6px)',
                }}
            >
                <Box
                    sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '3px',
                        bgcolor: palette.background,
                        border: `2px solid ${palette.border}`,
                        boxSizing: 'border-box',
                    }}
                />

                <Typography
                    sx={{
                        fontSize: 12,
                        lineHeight: 1,
                        color: '#5F6B7A',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatMessage({
                        id: label.labelId,
                        defaultMessage: label.fallback,
                    })}
                </Typography>
            </Box>
        </Box>
    );
}