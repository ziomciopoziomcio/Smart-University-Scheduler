import {Box, CircularProgress, Paper} from '@mui/material';
import type {WeekScheduleProps} from '@api/types';
import {formatWeekRange} from './utils/dateUtils';
import {WeekScheduleGrid} from './WeekScheduleGrid';
import {WeekScheduleHeader} from './WeekScheduleHeader';
import {useIntl} from "react-intl";

const monthMessageIds = [
    'calendar.january',
    'calendar.february',
    'calendar.march',
    'calendar.april',
    'calendar.may',
    'calendar.june',
    'calendar.july',
    'calendar.august',
    'calendar.september',
    'calendar.october',
    'calendar.november',
    'calendar.december',
] as const;

export function WeekSchedule({
                                 entries,
                                 currentWeekStart,
                                 isLoading,
                                 onPrevWeek,
                                 onNextWeek,
                             }: WeekScheduleProps) {
    const {formatMessage} = useIntl();
    const monthId = monthMessageIds[currentWeekStart.getMonth()];
    const currentDateLabel = `${formatMessage({id: monthId})} ${currentWeekStart.getFullYear()}`;
    const rangeLabel = formatWeekRange(currentWeekStart);

    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                maxWidth: '100%',
                bgcolor: 'transparent',
                borderRadius: 0,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <WeekScheduleHeader
                currentDateLabel={currentDateLabel}
                rangeLabel={rangeLabel}
                onPrevWeek={onPrevWeek}
                onNextWeek={onNextWeek}
            />

            <Box sx={{position: 'relative'}}>
                <WeekScheduleGrid entries={entries}/>

                {isLoading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(255,255,255,0.35)',
                            zIndex: 30,
                        }}
                    >
                        <CircularProgress size={34}/>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}