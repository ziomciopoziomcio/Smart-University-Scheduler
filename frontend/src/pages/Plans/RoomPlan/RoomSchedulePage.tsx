import {Box} from '@mui/material';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import type {ScheduleEntry} from '@api/types.ts';
import {WeekSchedule} from '@components/Schedule/WeekSchedule.tsx';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils.ts';
import {getMockRoomScheduleEntries} from '../../../mocks/roomPlansMock.tsx';

// TODO: Replace with backend API call
export async function getRoomScheduleForWeek(
    campusId: string,
    buildingId: string,
    roomId: string,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    const weekEnd = addDays(weekStart, 6);
    const startIso = toIsoDate(weekStart);
    const endIso = toIsoDate(weekEnd);

    return new Promise((resolve) => {
        setTimeout(() => {
            const allEntries = getMockRoomScheduleEntries({
                campusId,
                buildingId,
                roomId,
            });

            const filtered = allEntries.filter((entry) => {
                return entry.date >= startIso && entry.date <= endIso;
            });

            resolve(filtered);
        }, 700);
    });
}

export default function RoomSchedulePage() {
    const {campusId, buildingId, roomId} = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!campusId || !buildingId || !roomId) return;

        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            setIsLoading(true);

            try {
                const response = await getRoomScheduleForWeek(
                    campusId,
                    buildingId,
                    roomId,
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