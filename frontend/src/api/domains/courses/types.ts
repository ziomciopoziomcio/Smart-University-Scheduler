import {type ClassType, type CourseLanguage} from "@api/core";

export interface Major {
    id: number;
    study_field: number | null;
    major_name: string;
    group_count?: number;
}

export type MajorCreate = Omit<Major, 'id' | 'group_count'>;
export type MajorUpdate = Partial<MajorCreate>;
export type MajorDetails = Pick<Major, 'id' | 'major_name'>;

export interface ElectiveBlock {
    id: number;
    study_field: number;
    elective_block_name: string;
}

export type ElectiveBlockCreate = Omit<ElectiveBlock, 'id'>;
export type ElectiveBlockUpdate = Partial<ElectiveBlockCreate>;

export interface StudyField {
    id: number;
    faculty: number;
    field_name: string;
    language?: string;
    mode?: string;
    semesters_count?: number;
    specializations_count?: number;
    elective_blocks_count?: number;
    programs_count?: number;
}

export type StudyFieldCreate = Omit<StudyField, 'id' | 'semesters_count' | 'specializations_count' | 'elective_blocks_count' | 'programs_count'>;
export type StudyFieldUpdate = Partial<StudyFieldCreate>;

export interface StudyPlanGroupSummary {
    id: number;
    group_name: string;
    group_code: string;
}

export interface Course {
    course_code: number;
    course_name: string;
    ects_points: number;
    leading_unit: number;
    course_language: CourseLanguage;
    course_coordinator: number;
    major?: number | null;
    elective_block?: number | null;
}

export type CourseCreate = Course;
export type CourseUpdate = Partial<Omit<Course, 'course_code'>>;

export interface CourseFilters {
    leading_unit?: number;
    major?: number;
    elective_block?: number;
    min_ects_points?: number;
    max_ects_points?: number;
    language?: CourseLanguage;
}

export interface CourseInstructor {
    employee: number;
    course: number;
    class_type: ClassType;
    hours: number;
}

export interface SemesterSummary {
    semester_number: number;
    courses_count: number;
    ects_sum: number;
}

export interface StudyProgram {
    id: number;
    study_field: number;
    start_year: string;
    program_name?: string | null;
    semesters_count?: number;
    semester_summary?: SemesterSummary[];
}

export type StudyProgramCreate = Omit<StudyProgram, 'id' | 'semesters_count' | 'semester_summary'>;
export type StudyProgramUpdate = Partial<StudyProgramCreate>;
export type StudyProgramDetails = StudyProgram;

export interface CourseSummary {
    course_code: number;
    course_name: string;
    ects_points: number;
}

export interface CourseTypeDetail {
    course: number;
    class_type: ClassType;
    class_hours: number;
    slots_per_class: number;
    frequency: string;
    manual_weeks: number[] | null;
    pc_needed: boolean;
    projector_needed: boolean;
    max_group_participants_number: number;
}

export type CourseTypeDetailCreate = Omit<CourseTypeDetail, 'slots_per_class' | 'manual_weeks' | 'pc_needed' | 'projector_needed' | 'max_group_participants_number'> &
    Partial<Pick<CourseTypeDetail, 'slots_per_class' | 'manual_weeks' | 'pc_needed' | 'projector_needed' | 'max_group_participants_number'>>;

export type CourseTypeDetailUpdate = Partial<Omit<CourseTypeDetailCreate, 'course' | 'class_type'>>;

export interface CurriculumCourse {
    study_program: number;
    course: number;
    semester: number;
    major?: number | null;
    elective_block?: number | null;
    course_details?: CourseSummary;
    major_details?: MajorDetails | null;
    elective_block_details?: ElectiveBlock | null;
}

export type CurriculumCourseCreate = Omit<CurriculumCourse, 'course_details' | 'major_details' | 'elective_block_details'>;
export type CurriculumCourseUpdate = Pick<CurriculumCourse, 'major' | 'elective_block'>;

export interface CurriculumFilters {
    study_program?: number;
    course?: number;
    semester?: number;
    major?: number;
    elective_block?: number;
}