export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

export type CourseLanguage = 'Polish' | 'English' | 'French';

export type ClassType =
    | 'Lecture'
    | 'Tutorials'
    | 'Laboratory'
    | 'Seminar'
    | 'Other'
    | 'E-learning';