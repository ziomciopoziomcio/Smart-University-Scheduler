import {type ClassType, type CourseLanguage} from "@api/core";

export interface MajorBase {
    study_field: number | null;
    major_name: string;
}

export type MajorCreate = MajorBase;

export interface MajorUpdate {
    study_field?: number | null;
    major_name?: string;
}

export interface Major extends MajorBase {
    id: number;
    study_field: number | null;
    major_name: string;
    group_count?: number;
}

export interface MajorDetails {
    id: number;
    major_name: string;
}

export interface ElectiveBlockBase {
    study_field: number;
    elective_block_name: string;
}

export interface ElectiveBlock extends ElectiveBlockBase {
    id: number;
}

export type ElectiveBlockCreate = ElectiveBlockBase;

export interface ElectiveBlockUpdate {
    study_field?: number;
    elective_block_name?: string;
}



export interface StudyFieldBase {
    faculty: number;
    field_name: string;
}

export type StudyFieldCreate = StudyFieldBase;

export interface StudyFieldUpdate {
    faculty?: number;
    field_name?: string;
}

export interface StudyField extends StudyFieldBase {
    id: number;
    faculty: number;
    field_name: string;
    language?: string;
    study_mode?: string;
    semesters_count?: number;
    major_count?: number | null;
}

export interface StudyFieldSemesterSummary {
    semester_number: number;
    groups_count: number;
    major_count?: number | null;
    elective_blocks_count?: number | null;
}



export interface StudyPlanGroupSummary {
    id: number;
    group_name: string;
    group_code: string;
}

export interface CourseBase {
    course_name: string;
    ects_points: number;
    leading_unit: number;
    course_language: CourseLanguage;
    course_coordinator: number;
    major?: number | null;
    elective_block?: number | null;
}

export interface Course extends CourseBase {
    course_code: number;
}

export interface CourseCreate extends CourseBase {
    course_code: number;
}

export type CourseUpdate = Partial<CourseBase>;

export interface CourseInstructor {
    employee: number;
    course: number;
    class_type: ClassType;
    hours: number;
}

export interface CourseFilters {
    leading_unit?: number;
    major?: number;
    elective_block?: number;
    min_ects_points?: number;
    max_ects_points?: number;
    language?: CourseLanguage;
}

export interface StudyProgramBase {
    study_field: number;
    start_year: string;
    program_name?: string | null;
}

export interface StudyProgram extends StudyProgramBase {
    id: number;
}

export type StudyProgramCreate = StudyProgramBase;
export type StudyProgramUpdate = Partial<StudyProgramBase>;

export type StudyProgramDetails = StudyProgram;


export interface CurriculumCourseBase {
    study_program: number;
    course: number;
    semester: number;
    major?: number | null;
    elective_block?: number | null;
}

export interface CurriculumCourse extends CurriculumCourseBase {}

export type CurriculumCourseCreate = CurriculumCourseBase;

export interface CurriculumCourseUpdate {
    major?: number | null;
    elective_block?: number | null;
}

export interface CurriculumFilters {
    study_program?: number;
    course?: number;
    semester?: number;
    major?: number;
    elective_block?: number;
}