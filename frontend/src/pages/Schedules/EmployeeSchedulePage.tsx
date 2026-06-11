import {Box, CircularProgress} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useIntl} from 'react-intl';

import {
    type Faculty,
    type ScheduleEntry,
    type Lecturer,
    getFaculty,
    fetchLecturerPlan,
    getLecturerById,
    getUnit
} from '@api';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {toIsoDate} from '@components/Schedule/utils/dateUtils.ts';
import {useCalendarWeekStore} from '@store/useCalendarWeekStore';
import {PageBreadcrumbs, type BreadcrumbItem} from '@components/Common';


export async function getLecturerScheduleForWeek(
    lecturerId: string,
    weekStart: Date,
    unitId?: string
): Promise<ScheduleEntry[]> {
    return await fetchLecturerPlan({
        instructorId: Number(lecturerId),
        unitId: unitId ? Number(unitId) : undefined,
        startDate: toIsoDate(weekStart),
    });
}

export default function EmployeeSchedulePage() {
    const intl = useIntl();
    const {facultyId, unitId, lecturerId} = useParams();

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

    const [facultyName, setFacultyName] = useState<string>('');
    const [unitName, setUnitName] = useState<string>('');
    const [lecturerLabel, setLecturerLabel] = useState<string>('');

    useEffect(() => {
        if (!facultyId || !unitId || !lecturerId) return;

        let cancelled = false;

        const fetchNames = async () => {
            setIsNamesLoading(true);

            try {
                const [faculty, unit, lecturer] = await Promise.all([
                    getFaculty(Number(facultyId)) as Promise<Faculty>,
                    getUnit(Number(unitId)),
                    getLecturerById(Number(lecturerId)) as Promise<Lecturer>
                ]);

                if (!cancelled) {
                    setFacultyName(faculty.faculty_short || faculty.faculty_name);
                    setLecturerLabel(
                        lecturer
                            ? [lecturer.degree, lecturer.name, lecturer.surname].filter(Boolean).join(' ')
                            : lecturerId
                    );
                    setUnitName(unit.unit_short)
                }
            } catch {
                if (!cancelled) {
                    setFacultyName('');
                    setUnitName('');
                    setLecturerLabel('');
                }
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
    }, [facultyId, unitId, lecturerId]);

    useEffect(() => {
        if (!lecturerId) return;

        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            setIsScheduleLoading(true);

            try {
                const response = await getLecturerScheduleForWeek(
                    lecturerId,
                    currentWeekStart,
                    unitId
                );

                if (!isCancelled) {
                    setEntries(response);
                }
            } catch (error) {
                console.error('Nie udało się pobrać planu prowadzącego', error);

                if (!isCancelled) {
                    setEntries([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsScheduleLoading(false);
                }
            }
        };

        void fetchWeekSchedule();

        return () => {
            isCancelled = true;
        };
    }, [lecturerId, unitId, currentWeekStart]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/schedules'
            },
            {
                label: intl.formatMessage({id: 'plans.lecturerPlan.title'}),
                path: '/schedules/lecturers/faculty'
            },
            {
                label: facultyName || facultyId || '...',
                path: `/schedules/lecturers/faculty/${facultyId}/unit`
            },
            {
                label: unitName || unitId || '...',
                path: `/schedules/lecturers/faculty/${facultyId}/unit/${unitId}/lecturer`
            },
            {
                label: lecturerLabel || lecturerId || '...',
                path: ''
            },
        ];
    }, [intl, facultyId, unitId, lecturerId, facultyName, unitName, lecturerLabel]);

    if (isNamesLoading) {
        return (
            <Box
                sx={{
                    width: '100%',
                    minHeight: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                onPrevWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
            />
        </Box>
    );
}