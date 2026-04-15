import {Box} from '@mui/material';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import type {ScheduleEntry} from '@api/types';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addWeeks, getStartOfWeek} from '@components/Schedule/utils/dateUtils';
import {studyPlanScheduleMock} from '../../../mocks/studyPlansMock';

async function getStudyPlanScheduleForWeek(
    curriculumYearId: string,
    fieldOfStudyId: string,
    semesterId: string,
    specializationId: string | null,
    electiveBlockId: string | null,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    console.log('Fetch study plan schedule', {
        curriculumYearId,
        fieldOfStudyId,
        semesterId,
        specializationId,
        electiveBlockId,
        weekStart,
    });

    const key = `${curriculumYearId}|${fieldOfStudyId}|${semesterId}|${specializationId ?? 'null'}|${electiveBlockId ?? 'null'}`;

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(studyPlanScheduleMock[key] ?? []);
        }, 700);
    });
}

export default function StudyPlanSchedulePage() {
    const {
        curriculumYearId,
        fieldOfStudyId,
        semesterId,
        specializationId,
        electiveBlockId,
    } = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!curriculumYearId || !fieldOfStudyId || !semesterId) return;

        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);

            try {
                const response = await getStudyPlanScheduleForWeek(
                    curriculumYearId,
                    fieldOfStudyId,
                    semesterId,
                    specializationId ?? null,
                    electiveBlockId ?? null,
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
    }, [
        curriculumYearId,
        fieldOfStudyId,
        semesterId,
        specializationId,
        electiveBlockId,
        currentWeekStart,
    ]);

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