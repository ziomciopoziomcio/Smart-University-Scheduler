export type ScheduleTileVariant = 'lecture' | 'lab' | 'exercise' | 'project' | 'seminar';

export interface ScheduleEntry {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    variant: ScheduleTileVariant;
}

export interface WeekScheduleProps {
    entries: ScheduleEntry[];
    currentWeekStart: Date;
    isLoading: boolean;
    onPrevWeek: () => void;
    onNextWeek: () => void;
}

export interface CourseSessionDetailsResponse {
    courseName?: string;
    course_name?: string;
    type: string;
    time: string;
    location: {
        campus: string;
        building: string;
        room: string;
    };
    lecturer: string;
    targetAudience?: string[];
    target_audience?: string[];
}

export interface ScheduleEntryAudience {
    fieldOfStudy: string;
    semester: string;
    specialization: string;
}

export interface ScheduleEntryDetails {
    typeLabel: string;
    timeLabel: string;
    location: {
        campus: string;
        building: string;
        room: string;
    };
    lecturer: string;
    audience: ScheduleEntryAudience[];
}