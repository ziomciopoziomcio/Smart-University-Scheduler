import {Box, Typography} from '@mui/material';
import {useIntl} from 'react-intl';
import type {ScheduleTileVariant} from '@api';
import {getTilePaletteByVariant} from './utils/tileColorUtils';

const legendItems: {variant: ScheduleTileVariant; labelId: string; fallback: string}[] = [
    {
        variant: 'lecture',
        labelId: 'schedule.subjectType.lecture',
        fallback: 'Lecture',
    },
    {
        variant: 'lab',
        labelId: 'schedule.subjectType.lab',
        fallback: 'Laboratory',
    },
    {
        variant: 'exercise',
        labelId: 'schedule.subjectType.exercise',
        fallback: 'Classes',
    },
    {
        variant: 'project',
        labelId: 'schedule.subjectType.project',
        fallback: 'Project',
    },
    {
        variant: 'seminar',
        labelId: 'schedule.subjectType.seminar',
        fallback: 'Seminar',
    },
];

export function ScheduleLegend() {
    const {formatMessage} = useIntl();

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 1,
                mt: 1,
                mb: 1.5,
                pr: 0.5,
            }}
        >
            {legendItems.map((item) => {
                const palette = getTilePaletteByVariant(item.variant);

                return (
                    <Box
                        key={item.variant}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1,
                            py: 0.45,
                            borderRadius: '999px',
                            bgcolor: 'rgba(255,255,255,0.58)',
                            border: '1px solid rgba(0,0,0,0.05)',
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
                            }}
                        >
                            {formatMessage({
                                id: item.labelId,
                                defaultMessage: item.fallback,
                            })}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}