import {Box, CircularProgress} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useIntl} from 'react-intl';

import {
    type CourseInstructor,
    type Faculty,
    type Unit,
    type PaginatedResponse,
    type ScheduleEntry,
    getFaculty,
    fetchUnits
} from '@api';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';
import {getMockLecturerScheduleEntries} from '../../mocks/lecturerPlansMock.tsx';
import {PageBreadcrumbs, type BreadcrumbItem} from '@components/Common';


export async function getLecturerScheduleForWeek(facultyId: string, lecturerId: string, weekStart: Date): Promise<ScheduleEntry[]> {
    const weekEnd = addDays(weekStart, 6);
    const startIso = toIsoDate(weekStart);
    const endIso = toIsoDate(weekEnd);

    return new Promise((resolve) => {
        setTimeout(() => {
            const allEntries = getMockLecturerScheduleEntries({departmentId: facultyId, lecturerId});
            resolve(allEntries.filter(entry => entry.date >= startIso && entry.date <= endIso));
        }, 700);
    });
}

// TODO: Replace with backend API call
const mockedLecturers: CourseInstructor[] = [
    {id: 1, name: 'Piotr', surname: 'Duch', degree: 'dr inż.'},
    {id: 2, name: 'Robert', surname: 'Kapturski', degree: 'mgr inż.'},
    {id: 3, name: 'Anna', surname: 'Nowak', degree: 'dr hab. inż.'},
];

export default function EmployeeSchedulePage() {
    const intl = useIntl();
    const {facultyId, unitId, lecturerId} = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
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
                const [faculty, unitsRes] = await Promise.all([
                    getFaculty(Number(facultyId)) as Promise<Faculty>,
                    fetchUnits(Number(facultyId)) as Promise<PaginatedResponse<Unit>>
                ]);

                const unit = unitsRes.items.find(u => String(u.id) === String(unitId));
                const lecturer = mockedLecturers.find(item => String(item.id) === String(lecturerId));

                if (!cancelled) {
                    setFacultyName(faculty.faculty_short || faculty.faculty_name);
                    setUnitName(unit ? unit.unit_short : unitId);
                    setLecturerLabel(lecturer ? [lecturer.degree, lecturer.name, lecturer.surname].filter(Boolean).join(' ') : lecturerId);
                }
            } catch (error) {
                if (!cancelled) {
                    setFacultyName('');
                    setUnitName('');
                    setLecturerLabel('');
                }
            } finally {
                if (!cancelled) setIsNamesLoading(false);
            }
        };

        void fetchNames();
        return () => {
            cancelled = true;
        };
    }, [facultyId, unitId, lecturerId]);

    useEffect(() => {
        if (!facultyId || !lecturerId) return;
        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            setIsScheduleLoading(true);
            try {
                const response = await getLecturerScheduleForWeek(facultyId, lecturerId, currentWeekStart);
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
    }, [facultyId, lecturerId, currentWeekStart]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {label: intl.formatMessage({id: 'plans.plans'}), path: '/plans'},
            {label: intl.formatMessage({id: 'plans.lecturerPlan.title'}), path: '/plans/lecturers/faculty'},
            {label: facultyName || facultyId || '...', path: `/plans/lecturers/faculty/${facultyId}/unit`},
            {label: unitName || unitId || '...', path: `/plans/lecturers/faculty/${facultyId}/unit/${unitId}/lecturer`},
            {label: lecturerLabel || lecturerId || '...', path: ""},
        ];
    }, [intl, facultyId, unitId, lecturerId, facultyName, unitName, lecturerLabel]);

    if (isNamesLoading) return <Box sx={{
        width: '100%',
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}><CircularProgress/></Box>;

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <PageBreadcrumbs items={breadcrumbs}/>
            <WeekSchedule entries={entries} currentWeekStart={currentWeekStart} isLoading={isScheduleLoading}
                          onPrevWeek={() => setCurrentWeekStart(prev => addWeeks(prev, -1))}
                          onNextWeek={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}/>
        </Box>
    );
}