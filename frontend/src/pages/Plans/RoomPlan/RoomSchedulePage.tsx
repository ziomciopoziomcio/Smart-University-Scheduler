import {Box, CircularProgress} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import type {ScheduleEntry} from '@api/types.ts';
import {WeekSchedule} from '@components/Schedule/WeekSchedule.tsx';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils.ts';
import {getMockRoomScheduleEntries} from '../../../mocks/roomPlansMock.tsx';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import {getBuilding, getCampus, getRoom} from '@api/facilities.ts';

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

    const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);
    const [isNamesLoading, setIsNamesLoading] = useState<boolean>(true);

    const [buildingName, setBuildingName] = useState<string>('');
    const [campusName, setCampusName] = useState<string>('');
    const [roomName, setRoomName] = useState<string>('');

    useEffect(() => {
        if (!campusId || !buildingId || !roomId) return;

        let cancelled = false;

        const fetchNames = async () => {
            setIsNamesLoading(true);

            try {
                const [buildingResponse, roomResponse, campusResponse] = await Promise.all([
                    getBuilding(Number(buildingId)),
                    getRoom(Number(roomId)),
                    getCampus(Number(campusId)),
                ]);

                if (!cancelled) {
                    setBuildingName(
                        buildingResponse.building_name?.trim()
                            ? buildingResponse.building_name
                            : `Budynek ${buildingResponse.building_number}`,
                    );
                    setCampusName(campusResponse.campus_short);
                    setRoomName(roomResponse.room_name);
                }
            } catch (error) {
                if (!cancelled) {
                    setBuildingName('');
                    setCampusName('');
                    setRoomName('');
                }
            } finally {
                if (!cancelled) {
                    setIsNamesLoading(false);
                }
            }
        };

        fetchNames();

        return () => {
            cancelled = true;
        };
    }, [campusId, buildingId, roomId]);

    useEffect(() => {
        if (!campusId || !buildingId || !roomId) return;

        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            setIsScheduleLoading(true);

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
                    setIsScheduleLoading(false);
                }
            }
        };

        fetchWeekSchedule();

        return () => {
            isCancelled = true;
        };
    }, [campusId, buildingId, roomId, currentWeekStart]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: 'Plany',
                path: '/plans',
            },
            {
                label: 'Plany sal',
                path: '/plans/rooms/campus',
            },
            {
                label: campusName,
                path: `/plans/rooms/campus/${campusId}/building`,
            },
            {
                label: buildingName,
                path: `/plans/rooms/campus/${campusId}/building/${buildingId}/room`,
            },
            {
                label: roomName,
                path: `/plans/rooms/campus/${campusId}/building/${buildingId}/room/${roomId}`,
            },
        ];
    }, [campusId, buildingId, roomId, campusName, buildingName, roomName]);

    const handlePrevWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, -1));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, 1));
    };

    if (isNamesLoading) {
        return (
            <Box
                sx={{
                    width: '100%',
                    minHeight: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress/>
            </Box>
        );
    }

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <PageBreadcrumbs items={breadcrumbs}/>

            <WeekSchedule
                entries={entries}
                currentWeekStart={currentWeekStart}
                isLoading={isScheduleLoading}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
            />
        </Box>
    );
}