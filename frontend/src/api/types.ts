export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    degree: string | null;
    phone_number: string | null;
    created_at: string;
    roles?: string[];
    two_factor_enabled?: boolean;
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

export interface Faculty {
    id: number;
    faculty_name: string;
    faculty_short: string;
    lecturers_count?: number;
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
    start_year: string;
    program_name?: string | null;
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
    unit_id: number;
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

export interface Permission {
    id: number;
    code: string;
    name: string | null;
    description: string | null;
    group: string | null;
}

export interface Role {
    id: number;
    role_name: string;
    permissions: Permission[];
}

//////// COURSES
//TODO: Need more details from backend
export interface StudyField {
    id: number;
    faculty: number;
    field_name: string;
    language?: string;
    study_mode?: string;
    semesters_count?: number;
    specializations_count?: number | null;
}

export interface StudyFieldSemesterSummary {
    semester_number: number;
    groups_count: number;
    specializations_count?: number | null;
    elective_blocks_count?: number | null;
}

export interface StudyPlanGroupSummary {
    id: number;
    group_name: string;
    group_code: string;
}

export interface Major {
    id: number;
    study_field: number | null;
    major_name: string;
    group_count?: number;
}

export interface ElectiveBlock {
    id: number;
    name: string;
}

export interface Group {
    id: number;
    group_name: string;
    study_program: number;
    major: number | null;
    elective_block: number | null;
}

///// USERS
export interface CourseInstructor {
    id: number;
    name: string;
    surname: string;
    degree?: string | null;
}