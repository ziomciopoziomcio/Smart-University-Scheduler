import {Box, Typography} from '@mui/material';
import {useIntl} from 'react-intl';
import type {ScheduleEntry} from '@api';
import {getTilePaletteByVariant} from './utils/tileColorUtils';

type ScheduleTileVariant = ScheduleEntry['variant'];

interface ScheduleLegendProps {
    variant: ScheduleTileVariant | null;
}

const legendLabels: Record<string, {labelId: string; defaultMessage: string}> = {
    lecture: {
        labelId: 'schedule.subjectType.lecture',
        defaultMessage: 'Lecture',
    },
    lab: {
        labelId: 'schedule.subjectType.lab',
        defaultMessage: 'Laboratory',
    },
    laboratory: {
        labelId: 'schedule.subjectType.lab',
        defaultMessage: 'Laboratory',
    },
    exercise: {
        labelId: 'schedule.subjectType.exercise',
        defaultMessage: 'Exercise',
    },
    tutorials: {
        labelId: 'schedule.subjectType.exercise',
        defaultMessage: 'Exercise',
    },
    project: {
        labelId: 'schedule.subjectType.project',
        defaultMessage: 'Project',
    },
    seminar: {
        labelId: 'schedule.subjectType.seminar',
        defaultMessage: 'Seminar',
    },
};

const normalizeVariant = (variant: ScheduleTileVariant): string => {
    return String(variant).toLowerCase();
};

export function ScheduleLegend({variant}: ScheduleLegendProps) {
    const {formatMessage} = useIntl();

    if (!variant) {
        return null;
    }

    const normalizedVariant = normalizeVariant(variant);
    const palette = getTilePaletteByVariant(variant);
    const label = legendLabels[normalizedVariant] ?? {
        labelId: `schedule.subjectType.${normalizedVariant}`,
        defaultMessage: normalizedVariant,
    };

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
                        defaultMessage: label.defaultMessage,
                    })}
                </Typography>
            </Box>
        </Box>
    );
}