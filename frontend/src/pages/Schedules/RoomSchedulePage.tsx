import {Box, CircularProgress} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useIntl} from 'react-intl';
import {type ScheduleEntry, type Building, type Room, type Campus, getBuilding, getCampus, getRoom} from '@api';
import {WeekSchedule} from '@components/Schedule/WeekSchedule.tsx';
import {toIsoDate} from '@components/Schedule/utils/dateUtils.ts';
import {useCalendarWeekStore} from '@store/useCalendarWeekStore';
import {fetchRoomPlan} from '@api/domains/schedules';
import {PageBreadcrumbs, type BreadcrumbItem} from '@components/Common';

export async function getRoomScheduleForWeek(
    campusId: number,
    buildingId: number,
    roomId: number,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    return fetchRoomPlan({
        campusId: campusId,
        buildingId: buildingId,
        roomId: roomId,
        startDate: toIsoDate(weekStart),
    });
}

export default function RoomSchedulePage() {
    const {campusId, buildingId, roomId} = useParams();
    const intl = useIntl();
    const [refreshRevision, setRefreshRevision] = useState(0);

    const currentWeekStart = useCalendarWeekStore(
        (state) => state.currentWeekStart,
    );

    const goToPreviousWeek = useCalendarWeekStore(
        (state) => state.goToPreviousWeek,
    );

    const goToNextWeek = useCalendarWeekStore(
        (state) => state.goToNextWeek,
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
                    Number(campusId),
                    Number(buildingId),
                    Number(roomId),
                    currentWeekStart,
                );
                if (!isCancelled) setEntries(response);
            } catch {
                if (!isCancelled) setEntries([]);
            } finally {
                if (!isCancelled) setIsScheduleLoading(false);
            }
        };

        void fetchWeekSchedule();
        return () => {
            isCancelled = true;
        };
    }, [campusId, buildingId, roomId, currentWeekStart, refreshRevision]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/schedules',
            },
            {
                label: intl.formatMessage({id: 'plans.roomsPlan.title'}),
                path: '/schedules/rooms/campus',
            },
        ];

        if (campusId) {
            items.push({
                label: currentCampus ?
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${currentCampus.campus_short}` :
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${campusId}`,
                path: `/schedules/rooms/campus/${campusId}/building`,
            });
        }

        if (buildingId) {
            items.push({
                label: currentBuilding ?
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${currentBuilding.building_number}` :
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${buildingId}`,
                path: `/schedules/rooms/campus/${campusId}/building/${buildingId}/room`
            });
        }

        if (roomId) {
            items.push({
                label: currentRoom ? currentRoom.room_name : roomId,
                path: `/schedules/rooms/campus/${campusId}/building/${buildingId}/room/${roomId}`,
            });
        }

        return items;
    }, [intl, campusId, buildingId, roomId, currentCampus, currentBuilding, currentRoom]);


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
                    onPrevWeek={goToPreviousWeek}
                    onNextWeek={goToNextWeek}
                    onSessionUpdated={() => {
                        setRefreshRevision((revision) => revision + 1);
                    }}
                />
            )}
        </Box>
    );
}