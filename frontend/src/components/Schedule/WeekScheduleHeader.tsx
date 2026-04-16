import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import {Box, IconButton, Typography} from '@mui/material';

interface WeekScheduleHeaderProps {
    currentDateLabel: string;
    rangeLabel: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
}

export function WeekScheduleHeader({
                                       currentDateLabel,
                                       rangeLabel,
                                       onPrevWeek,
                                       onNextWeek,
                                   }: WeekScheduleHeaderProps) {
    return (
        <Box
            sx={{
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                px: 2,
            }}
        >
            <IconButton size="large" onClick={onPrevWeek}>
                <ChevronLeftOutlined fontSize="large"/>
            </IconButton>

            <Box sx={{textAlign: 'center', lineHeight: 1.2}}>
                <Typography
                    sx={{
                        fontSize: '25px',
                        fontWeight: 515,
                        color: '#262626',
                        letterSpacing: '-0.2px',
                    }}
                >
                    {currentDateLabel}
                </Typography>
                <Typography
                    sx={{
                        fontSize: '19px',
                        fontWeight: 500,
                        color: '#262626',
                        opacity: 0.9,
                    }}
                >
                    {rangeLabel}
                </Typography>
            </Box>

            <IconButton size="large" onClick={onNextWeek}>
                <ChevronRightOutlined fontSize="large"/>
            </IconButton>
        </Box>
    );
}