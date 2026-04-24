import type {User} from "@api/domains/users/types";
import type {MajorDetails, StudyProgramDetails} from "@api/domains/courses/types";

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

export interface Group {
    id: number;
    group_name: string;
    study_program: number;
    major: number | null;
    elective_block: number | null;
}

export interface Unit {
    id: number;
    unit_name: string;
    unit_short: string;
    faculty_id: number;
}

export interface StudyFieldSemesterSummary {
    semester_number: number;
    groups_count: number;
    major_count?: number | null;
    elective_blocks_count?: number | null;
}