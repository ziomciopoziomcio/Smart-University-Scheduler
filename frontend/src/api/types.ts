export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    degree: string | null;
    phone_number: string | null;
    created_at: string;
    roles?: string[];
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    requires_2fa: boolean;
    user?: User;
}

export interface LoginError {
    detail: string | { msg: string }[];
}

export interface Campus {
    id: number;
    campus_name: string;
    campus_short: string;
}

export interface Building {
    id: number;
    building_name: string | null;
    building_number: string;
    campus_id: number;
}

export interface Room {
    id: number;
    room_name: string;
    building_id: number;
    faculty_id: number;
    pc_amount: number;
    room_capacity: number;
    unit_id: number | null;
    projector_availability: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

export type ScheduleTileVariant = 'lecture' | 'lab' | 'exercise' | 'project' | 'seminar';

export interface SubjectAudienceItem {
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
    audience: SubjectAudienceItem[];
}

export interface ScheduleEntry {
    id: string;
    title: string;
    date: string;
    startHour: number;
    endHour: number;
    variant: ScheduleTileVariant;
}

export interface WeekScheduleProps {
    entries: ScheduleEntry[];
    currentWeekStart: Date;
    isLoading: boolean;
    onPrevWeek: () => void;
    onNextWeek: () => void;
}

export interface Faculty {
    id: number;
    faculty_name: string;
    faculty_short: string;
}

export interface Unit {
    id: number;
    unit_name: string;
    unit_short: string;
    faculty_id: number;
}

export interface StudyProgramDetails {
    id: number;
    study_field: number;
    start_year: number;
    program_name: string;
}

export interface MajorDetails {
    id: number;
    major_name: string;
}

export interface Student {
    id: number;
    user_id: number;
    study_program: number;
    major: number | null;
    user: User;
    study_program_details: StudyProgramDetails;
    major_details: MajorDetails | null;
}

export interface Employee {
    id: number;
    user_id: number;
    faculty_id: number;
    unit_id: number | null;
    user: User;
    unit: {
        id: number;
        unit_name: string;
        unit_short: string;
        faculty_id: number;
    } | null;
    faculty: {
        id: number;
        faculty_name: string;
        faculty_short: string;
    } | null;
}
