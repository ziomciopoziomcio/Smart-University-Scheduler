import {Box} from '@mui/material';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import type {ScheduleEntry} from '@api/types';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';
import {getMockStudyPlanScheduleEntries} from '../../../mocks/studyPlansMock';

// TODO: Replace with backend API call
export async function getStudyPlanScheduleForWeek(
    curriculumYearId: string,
    fieldOfStudyId: string,
    semesterId: string,
    specializationId: string | null,
    electiveBlockId: string | null,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    const weekEnd = addDays(weekStart, 6);
    const startIso = toIsoDate(weekStart);
    const endIso = toIsoDate(weekEnd);

    return new Promise((resolve) => {
        setTimeout(() => {
            const allEntries = getMockStudyPlanScheduleEntries({
                curriculumYearId,
                fieldOfStudyId,
                semesterId,
                specializationId,
                electiveBlockId,
            });

            const filtered = allEntries.filter((entry) => {
                return entry.date >= startIso && entry.date <= endIso;
            });

            resolve(filtered);
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
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!curriculumYearId || !fieldOfStudyId || !semesterId) return;

        let isCancelled = false;

        const fetchWeekSchedule = async () => {
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

                if (!isCancelled) {
                    setEntries(response);
                }
            } catch {
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