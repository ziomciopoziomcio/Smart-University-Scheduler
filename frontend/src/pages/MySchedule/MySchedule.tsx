import {Box} from '@mui/material';
import {useEffect, useState} from 'react';
import type {ScheduleEntry} from '@api';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {fetchStudentPlan} from '@api/domains/schedules';
import {useAuthStore} from '@store/useAuthStore';
import {addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';

//TODO: https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/275

export async function getScheduleForWeek(
    weekStart: Date,
    userId: number,
): Promise<ScheduleEntry[]> {
    return await fetchStudentPlan({
        userId: userId,
        startDate: toIsoDate(weekStart),
    });
}

export default function MySchedule() {
    const user = useAuthStore((state) => state.user);

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            if (!user?.id) {
                setEntries([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await getScheduleForWeek(currentWeekStart, user.id);

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

        fetchWeekSchedule();

        return () => {
            isCancelled = true;
        };
    }, [currentWeekStart, user?.id]);

    const handlePrevWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, -1));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, 1));
    };

    return (
        <Box sx={{width: '100%'}}>
            <WeekSchedule
                entries={entries}
                currentWeekStart={currentWeekStart}
                isLoading={isLoading}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
            />
        </Box>
    );
}