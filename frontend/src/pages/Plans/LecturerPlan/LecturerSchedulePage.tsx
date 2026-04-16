import {Box, CircularProgress} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import type {CourseInstructor, Faculty, ScheduleEntry} from '@api/types';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';
import {getMockLecturerScheduleEntries} from '../../../mocks/lecturerPlansMock';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import {getFaculty} from '@api/structures.ts';
import {useIntl} from 'react-intl';

// TODO: Replace with backend API call
export async function getLecturerScheduleForWeek(
    facultyId: string,
    lecturerId: string,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    const weekEnd = addDays(weekStart, 6);
    const startIso = toIsoDate(weekStart);
    const endIso = toIsoDate(weekEnd);

    return new Promise((resolve) => {
        setTimeout(() => {
            const allEntries = getMockLecturerScheduleEntries({
                departmentId: facultyId,
                lecturerId,
            });

            const filtered = allEntries.filter((entry) => {
                return entry.date >= startIso && entry.date <= endIso;
            });

            resolve(filtered);
        }, 700);
    });
}

const mockedLecturersByFacultyId: Record<number, CourseInstructor[]> = {
    1: [
        {id: 1, name: 'Piotr', surname: 'Duch', degree: 'Dr inż.'},
        {id: 2, name: 'Robert', surname: 'Kapturski', degree: 'Mgr inż.'},
        {id: 3, name: 'Anna', surname: 'Nowak', degree: 'Dr hab. inż.'},
    ],
    24: [
        {id: 1, name: 'Piotr', surname: 'Duch', degree: 'Dr inż.'},
        {id: 2, name: 'Robert', surname: 'Kapturski', degree: 'Mgr inż.'},
        {id: 4, name: 'Katarzyna', surname: 'Wójcik', degree: 'Dr inż.'},
        {id: 5, name: 'Michał', surname: 'Zalewski', degree: null},
    ],
};

export default function LecturerSchedulePage() {
    const navigate = useNavigate();
    const intl = useIntl();
    const {facultyId, lecturerId} = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);
    const [isNamesLoading, setIsNamesLoading] = useState<boolean>(true);

    const [facultyName, setFacultyName] = useState<string>('');
    const [lecturerLabel, setLecturerLabel] = useState<string>('');

    useEffect(() => {
        if (!facultyId || !lecturerId) return;

        let cancelled = false;

        const fetchNames = async () => {
            setIsNamesLoading(true);

            try {
                const faculty = await getFaculty(Number(facultyId)) as Faculty;
                const lecturer = (mockedLecturersByFacultyId[Number(facultyId)] ?? []).find(
                    (item) => String(item.id) === String(lecturerId),
                );

                if (!cancelled) {
                    setFacultyName(faculty.faculty_name);

                    if (lecturer) {
                        setLecturerLabel(
                            [lecturer.degree, lecturer.name, lecturer.surname]
                                .filter(Boolean)
                                .join(' '),
                        );
                    } else {
                        setLecturerLabel('');
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    setFacultyName('');
                    setLecturerLabel('');
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
    }, [facultyId, lecturerId]);

    useEffect(() => {
        if (!facultyId || !lecturerId) return;

        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            setIsScheduleLoading(true);

            try {
                const response = await getLecturerScheduleForWeek(
                    facultyId,
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
                    setIsScheduleLoading(false);
                }
            }
        };

        fetchWeekSchedule();

        return () => {
            isCancelled = true;
        };
    }, [facultyId, lecturerId, currentWeekStart]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        return [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({
                    id: 'plans.lecturerPlan.title',
                }),
                path: '/plans/lecturers/faculty',
            },
            {
                label: facultyName || facultyId || '...',
                path: `/plans/lecturers/faculty/${facultyId}/lecturer`,
            },
            {
                label: lecturerLabel || lecturerId || '...',
                path: "",
            },
            {
                label: intl.formatMessage({
                    id: 'plans.studentsPlan.studySchedule.title',
                    defaultMessage: 'Plan',
                }),
                path: "",
            },
        ];
    }, [intl, facultyId, lecturerId, facultyName, lecturerLabel]);

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