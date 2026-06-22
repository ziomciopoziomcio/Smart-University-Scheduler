import {Box} from '@mui/material';
import {useEffect, useState} from 'react';

import type {ScheduleEntry} from '@api';
import {fetchStudentPlan} from '@api/domains/schedules';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {toIsoDate} from '@components/Schedule/utils/dateUtils';
import {useAuthStore} from '@store/useAuthStore';
import {useCalendarWeekStore} from '@store/useCalendarWeekStore';

export async function getScheduleForWeek(
    weekStart: Date,
    userId: number,
): Promise<ScheduleEntry[]> {
    return await fetchStudentPlan({
        userId,
        startDate: toIsoDate(weekStart),
    });
}

export default function MySchedule() {
    const user = useAuthStore(
        (state) => state.user,
    );

    const currentWeekStart =
        useCalendarWeekStore(
            (state) =>
                state.currentWeekStart,
        );

    const goToPreviousWeek =
        useCalendarWeekStore(
            (state) =>
                state.goToPreviousWeek,
        );

    const goToNextWeek =
        useCalendarWeekStore(
            (state) =>
                state.goToNextWeek,
        );

    const [entries, setEntries] =
        useState<ScheduleEntry[]>([]);

    const [isLoading, setIsLoading] =
        useState(false);

    const [
        refreshRevision,
        setRefreshRevision,
    ] = useState(0);

    useEffect(() => {
        let isCancelled = false;

        const fetchWeekSchedule =
            async () => {
                if (!user?.id) {
                    setEntries([]);

                    return;
                }

                setIsLoading(true);

                try {
                    const response =
                        await getScheduleForWeek(
                            currentWeekStart,
                            user.id,
                        );

                    if (!isCancelled) {
                        setEntries(response);
                    }
                } catch {
                    if (!isCancelled) {
                        setEntries([]);
                    }
                } finally {
                    if (!isCancelled) {
                        setIsLoading(false);
                    }
                }
            };

        void fetchWeekSchedule();

        return () => {
            isCancelled = true;
        };
    }, [
        currentWeekStart,
        user?.id,
        refreshRevision,
    ]);

    return (
        <Box sx={{width: '100%'}}>
            <WeekSchedule
                entries={entries}
                currentWeekStart={
                    currentWeekStart
                }
                isLoading={isLoading}
                onPrevWeek={
                    goToPreviousWeek
                }
                onNextWeek={
                    goToNextWeek
                }
                onSessionUpdated={() => {
                    setRefreshRevision(
                        (revision) =>
                            revision + 1,
                    );
                }}
            />
        </Box>
    );
}