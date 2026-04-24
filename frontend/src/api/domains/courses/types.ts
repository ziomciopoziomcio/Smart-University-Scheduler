import {type CourseLanguage} from "@api/core";

export interface CourseInstructor {
    id: number;
    name: string;
    surname: string;
    degree?: string | null;
}

export interface MajorBase {
    study_field: number | null;
    major_name: string;
}

export type MajorCreate = MajorBase;

export interface MajorUpdate {
    study_field?: number | null;
    major_name?: string;
}

export interface Major extends MajorBase{
    id: number;
    study_field: number | null;
    major_name: string;
    group_count?: number;
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

export interface MajorDetails {
    id: number;
    major_name: string;
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

export interface Course {
    name: string;
    ects_points: number;
    language: CourseLanguage;
}

export interface CourseFilters {
    min_ects_points?: number;
    max_ects_points?: number;
    language?: CourseLanguage;
}