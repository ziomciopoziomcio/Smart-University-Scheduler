export interface CourseInstructor {
    id: number;
    name: string;
    surname: string;
    degree?: string | null;
}

export interface Major {
    id: number;
    study_field: number | null;
    major_name: string;
    group_count?: number;
}

export interface ElectiveBlock {
    id: number;
    elective_block_name: string;
    study_field: number;
}

export interface MajorDetails {
    id: number;
    major_name: string;
}

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

export interface StudyProgramDetails {
    id: number;
    study_field: number;
    start_year: string;
    program_name?: string | null;
}

export interface StudyPlanGroupSummary {
    id: number;
    group_name: string;
    group_code: string;
}