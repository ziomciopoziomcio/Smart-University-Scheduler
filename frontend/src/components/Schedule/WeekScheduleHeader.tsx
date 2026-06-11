import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import {Box, Button, IconButton, Typography} from '@mui/material';
import {useIntl} from 'react-intl';

interface WeekScheduleHeaderProps {
    currentDateLabel: string;
    rangeLabel: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onAddSession: () => void;
}

export function WeekScheduleHeader({
    currentDateLabel,
    rangeLabel,
    onPrevWeek,
    onNextWeek,
    onAddSession,
}: WeekScheduleHeaderProps) {
    const {formatMessage} = useIntl();

    return (
        <Box
            sx={{
                position: 'relative',
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                px: 2,
            }}
        >
            <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={onAddSession}
                sx={{
                    position: 'absolute',
                    top: 8,
                    left: 0,
                    minHeight: 34,
                    px: 1.5,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#5F6B7A',
                    bgcolor: 'rgba(255,255,255,0.82)',
                    boxShadow: 'none',
                    '&:hover': {
                        bgcolor: '#FFFFFF',
                        boxShadow: 'none',
                    },
                }}
            >
                {formatMessage({
                    id: 'schedule.add.button',
                    defaultMessage: 'Add session',
                })}
            </Button>

            <IconButton size="large" onClick={onPrevWeek}>
                <ChevronLeftOutlined fontSize="large" />
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
                <ChevronRightOutlined fontSize="large" />
            </IconButton>
        </Box>
    );
}