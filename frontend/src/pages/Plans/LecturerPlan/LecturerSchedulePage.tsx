import {Box} from '@mui/material';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import type {ScheduleEntry} from '@api/types';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';
import {getMockLecturerScheduleEntries} from '../../../mocks/lecturerPlansMock';

// TODO: Replace with backend API call
export async function getLecturerScheduleForWeek(
    departmentId: string,
    lecturerId: string,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    const weekEnd = addDays(weekStart, 6);
    const startIso = toIsoDate(weekStart);
    const endIso = toIsoDate(weekEnd);

    return new Promise((resolve) => {
        setTimeout(() => {
            const allEntries = getMockLecturerScheduleEntries({
                departmentId,
                lecturerId,
            });

            const filtered = allEntries.filter((entry) => {
                return entry.date >= startIso && entry.date <= endIso;
            });

            resolve(filtered);
        }, 700);
    });
}

export default function LecturerSchedulePage() {
    const {departmentId, lecturerId} = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!departmentId || !lecturerId) return;

        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            setIsLoading(true);

            try {
                const response = await getLecturerScheduleForWeek(
                    departmentId,
                    lecturerId,
                    currentWeekStart,
                );

                if (!isCancelled) {
                    setEntries(response);
                }
            } catch (error) {
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
    }, [departmentId, lecturerId, currentWeekStart]);

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