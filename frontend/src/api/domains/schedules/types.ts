export type ScheduleTileVariant =
    | 'lecture'
    | 'lab'
    | 'exercise'
    | 'project'
    | 'seminar';

export interface ScheduleEntry {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    variant: ScheduleTileVariant;
}

export interface SchedulePlanApiEntry {
    id: string;
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    start_time?: string;
    end_time?: string;
    variant?: string | null;
}

export type StudentPlanApiEntry = SchedulePlanApiEntry;
export type LecturerPlanApiEntry = SchedulePlanApiEntry;
export type RoomPlanApiEntry = SchedulePlanApiEntry;
export type StudyFieldPlanApiEntry = SchedulePlanApiEntry;

export interface FetchStudentPlanParams {
    userId: number;
    startDate: string;
}

export interface FetchLecturerPlanParams {
    instructorId: number;
    startDate: string;
    unitId?: number;
}

export interface FetchRoomPlanParams {
    campusId: number;
    buildingId: number;
    roomId: number;
    startDate: string;
}

export interface FetchStudyFieldPlanParams {
    startDate: string;
    studyField: number;
    semester: number;
    specializationId?: number | null;
    electiveBlockId?: number | null;
    groupId?: number | null;
}

export interface WeekScheduleProps {
    entries: ScheduleEntry[];
    currentWeekStart: Date;
    isLoading: boolean;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onSessionUpdated?: () => void | Promise<void>;
}

export interface CourseLocation {
    campus: string;
    building: string;
    room: string;
}

export interface CourseSessionDetailsResponse {
    courseName?: string;
    course_name?: string;
    type: string;
    time: string;
    location: CourseLocation;
    lecturer: string;
    targetAudience?: string[];
    target_audience?: string[];
}

export interface ScheduleEntryAudience {
    fieldOfStudy: string;
    semester: string;
    specialization?: string;
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

export const ScheduleVersionIssue = {
    Warning: 'WARNING',
    Critical: 'CRITICAL',
} as const;

export type ScheduleVersionIssue =
    typeof ScheduleVersionIssue[keyof typeof ScheduleVersionIssue];

export interface ScheduleNotification {
    issue: ScheduleVersionIssue;
    message: string;
}

export interface ScheduleVersion {
    id: number;
    notifications: ScheduleNotification[];
}

export interface GenerateScheduleRequest {
    faculty_id?: number;
}

export type DayOfWeek =
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY';

export interface UpdateScheduleSessionRequest {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    instructorId: number;
    roomId: number;
    applyOnce: boolean;
}

export type ScheduleEditInstructorOption = {
    id: number;
    name: string;
};

export type ScheduleEditRoomOption = {
    id: number;
    name: string;
    building?: string;
    campus?: string;
};


export interface ScheduleSessionEditOptionsResponse {
    current: {
        dayOfWeek: DayOfWeek;
        startTime: string;
        endTime: string;
        instructorId: number;
        roomId: number;
    };
    instructors: ScheduleEditInstructorOption[];
    rooms: ScheduleEditRoomOption[];
}

export type SemesterType = 'Winter' | 'Summer';

export interface PlannerSettingsPayload {
    faculty_id: number;
    planned_academic_year: string;
    planned_semester_type: SemesterType;
    is_planning_active: boolean;
}

export interface PlannerSettings extends PlannerSettingsPayload {
    id: number;
}

export interface WorkloadIssue {
    course_code: number;
    class_type: string;
    required_hours: number;
    available_hours: number;
}

export interface RoomIssue {
    course_code: number;
    group_names: string[];
    members_amount: number;
    pc_needed: boolean;
    projector_needed: boolean;
}

export interface OversizedGroupIssue {
    course_code: number;
    class_type: string;
    group_name: string;
    members_amount: number;
    max_capacity: number;
}

export interface ValidationReport {
    total_genes_to_generate: number;
    missing_competencies: string[];
    workload_mismatch: WorkloadIssue[];
    no_suitable_rooms: RoomIssue[];
    oversized_groups: OversizedGroupIssue[];
    semester_parity_warnings: string[];
}

export interface CreateScheduleSessionRequest {
    courseId: number;
    groupIds: number[];
    weeks: number[];
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    instructorId: number;
    roomId: number;
}

export interface CreateScheduleSessionResponse {
    session_id: string;
}

export interface ScheduleFacultyOption {
    id: number;
    name: string;
}
