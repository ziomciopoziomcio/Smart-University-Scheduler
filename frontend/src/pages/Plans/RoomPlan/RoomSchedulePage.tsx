import {Box} from '@mui/material';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import type {ScheduleEntry} from '@api/types.ts';
import {WeekSchedule} from '@components/Schedule/WeekSchedule.tsx';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils.ts';
import {roomScheduleMock} from '../../../mocks/roomPlansMock.tsx';

// TODO: Replace with backend API call for room schedule
async function getRoomScheduleForWeek(
    campusId: string,
    buildingId: string,
    roomId: string,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    const weekEnd = addDays(weekStart, 6);
    const weekStartIso = toIsoDate(weekStart);
    const weekEndIso = toIsoDate(weekEnd);

    return new Promise((resolve) => {
        setTimeout(() => {
            const roomEntries = roomScheduleMock[roomId] ?? [];

            const filteredEntries = roomEntries.filter((entry) => {
                return entry.date >= weekStartIso && entry.date <= weekEndIso;
            });

            resolve(filteredEntries);
        }, 700);
    });
}

export default function RoomSchedulePage() {
    const {campusId, buildingId, roomId} = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!campusId || !buildingId || !roomId) return;

        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);

            try {
                const response = await getRoomScheduleForWeek(
                    campusId,
                    buildingId,
                    roomId,
                    currentWeekStart,
                );

                if (!cancelled) {
                    setEntries(response);
                }
            } catch (error) {
                if (!cancelled) {
                    setEntries([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [campusId, buildingId, roomId, currentWeekStart]);

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