import {Paper} from '@mui/material';
import {useMemo, useState} from 'react';
import type {WeekScheduleProps} from '@api/types';
import {
    addWeeks,
    formatWeekRange,
    getStartOfWeek,
    isDateInWeek,
    parseIsoDate,
} from './utils/dateUtils.ts';
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

export function WeekSchedule({entries}: WeekScheduleProps) {
    const {formatMessage} = useIntl();

    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        getStartOfWeek(new Date()),
    );

    const currentDateLabel = useMemo(() => {
        const monthId = monthMessageIds[currentWeekStart.getMonth()];
        return `${formatMessage({id: monthId})} ${currentWeekStart.getFullYear()}`;
    }, [currentWeekStart]);

    const rangeLabel = useMemo(() => {
        return formatWeekRange(currentWeekStart);
    }, [currentWeekStart]);

    const visibleEntries = useMemo(() => {
        return entries.filter((entry) => {
            const entryDate = parseIsoDate(entry.date);
            return isDateInWeek(entryDate, currentWeekStart);
        });
    }, [entries, currentWeekStart]);

    const handlePrevWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, -1));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, 1));
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                maxWidth: '100%',
                bgcolor: 'transparent',
                borderRadius: 0,
                overflow: 'hidden',
            }}
        >
            <WeekScheduleHeader
                currentDateLabel={currentDateLabel}
                rangeLabel={rangeLabel}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
            />

            <WeekScheduleGrid entries={visibleEntries}/>
        </Paper>
    );
}