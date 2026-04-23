import {Box, CircularProgress} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useIntl} from 'react-intl';
import {type ScheduleEntry, type Building, type Room, type Campus, getBuilding, getCampus, getRoom} from '@api';
import {WeekSchedule} from '@components/Schedule/WeekSchedule.tsx';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils.ts';
import {getMockRoomScheduleEntries} from '../../mocks/roomPlansMock.tsx';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';

// TODO: Replace with backend API call when Issue #XYZ is done
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
    const intl = useIntl();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);

    const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);
    const [isNamesLoading, setIsNamesLoading] = useState<boolean>(true);

    const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);
    const [currentCampus, setCurrentCampus] = useState<Campus | null>(null);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

    useEffect(() => {
        if (!campusId || !buildingId || !roomId) return;

        let cancelled = false;

        const fetchNames = async () => {
            setIsNamesLoading(true);
            try {
                const [buildingRes, roomRes, campusRes] = await Promise.all([
                    getBuilding(Number(buildingId)),
                    getRoom(Number(roomId)),
                    getCampus(Number(campusId)),
                ]);

                if (!cancelled) {
                    setCurrentBuilding(buildingRes);
                    setCurrentRoom(roomRes);
                    setCurrentCampus(campusRes);
                }
            } catch (error) {
                console.error("Failed to fetch names for breadcrumbs", error);
            } finally {
                if (!cancelled) {
                    setIsNamesLoading(false);
                }
            }
        };

        void fetchNames();
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
                if (!isCancelled) setEntries(response);
            } catch (error) {
                if (!isCancelled) setEntries([]);
            } finally {
                if (!isCancelled) setIsScheduleLoading(false);
            }
        };

        void fetchWeekSchedule();
        return () => {
            isCancelled = true;
        };
    }, [campusId, buildingId, roomId, currentWeekStart]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({id: 'plans.roomsPlan.title'}),
                path: '/plans/rooms/campus',
            },
        ];

        if (campusId) {
            items.push({
                label: currentCampus ?
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${currentCampus.campus_short}` :
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${campusId}`,
                path: `/plans/rooms/campus/${campusId}/building`,
            });
        }

        if (buildingId) {
            items.push({
                label: currentBuilding ?
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${currentBuilding.building_number}` :
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${buildingId}`,
                path: `/plans/rooms/campus/${campusId}/building/${buildingId}/room`
            });
        }

        if (roomId) {
            items.push({
                label: currentRoom ? currentRoom.room_name : roomId,
                path: `/plans/rooms/campus/${campusId}/building/${buildingId}/room/${roomId}`,
            });
        }

        return items;
    }, [intl, campusId, buildingId, roomId, currentCampus, currentBuilding, currentRoom]);

    const handlePrevWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, -1));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, 1));
    };

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <PageBreadcrumbs items={breadcrumbs}/>

            {isNamesLoading ? (
                <Box sx={{
                    width: '100%',
                    minHeight: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <CircularProgress/>
                </Box>
            ) : (
                <WeekSchedule
                    entries={entries}
                    currentWeekStart={currentWeekStart}
                    isLoading={isScheduleLoading}
                    onPrevWeek={handlePrevWeek}
                    onNextWeek={handleNextWeek}
                />
            )}
        </Box>
    );
}