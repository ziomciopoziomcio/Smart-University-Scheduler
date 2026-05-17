export const PERMISSIONS = {
    USER_ME: 'user:me',

    USERS_VIEW: 'users:view',
    USER_VIEW: 'user:view',

    ROLES_VIEW: 'roles:view',
    ROLE_VIEW: 'role:view',
    PERMISSIONS_VIEW: 'permissions:view',

    STUDENTS_VIEW: 'students:view',
    STUDENT_VIEW: 'student:view',

    EMPLOYEES_VIEW: 'employees:view',
    EMPLOYEE_VIEW: 'employee:view',

    FACULTIES_VIEW: 'faculties:view',
    FACULTY_VIEW: 'faculty:view',

    UNITS_VIEW: 'units:view',
    UNIT_VIEW: 'unit:view',

    CAMPUSES_VIEW: 'campuses:view',
    CAMPUS_VIEW: 'campus:view',

    BUILDINGS_VIEW: 'buildings:view',
    BUILDING_VIEW: 'building:view',

    ROOMS_VIEW: 'rooms:view',
    ROOM_VIEW: 'room:view',

    STUDY_FIELDS_VIEW: 'study-fields:view',
    STUDY_FIELD_VIEW: 'study-field:view',

    COURSES_VIEW: 'courses:view',
    COURSE_VIEW: 'course:view',

    MAJORS_VIEW: 'majors:view',
    MAJOR_VIEW: 'major:view',

    ELECTIVE_BLOCKS_VIEW: 'elective-blocks:view',
    ELECTIVE_BLOCK_VIEW: 'elective-block:view',

    STUDY_PROGRAMS_VIEW: 'study-programs:view',
    STUDY_PROGRAM_VIEW: 'study-program:view',

    CURRICULUMS_VIEW: 'curriculums:view',
    CURRICULUM_VIEW: 'curriculum:view',

    GROUPS_VIEW: 'groups:view',
    GROUP_VIEW: 'group:view',

    SCHEDULES_VIEW: 'schedules:view',
    SCHEDULE_VIEW: 'schedule:view',
    SCHEDULE_VIEW_OTHERS: 'schedule:view_others',
    SCHEDULE_GENERATE: 'schedule:generate',

    CLASS_SESSIONS_VIEW: 'class-sessions:view',
    CLASS_SESSION_VIEW: 'class-session:view',

    SUGGESTIONS_VIEW: 'suggestions:view',
    SUGGESTION_VIEW: 'suggestion:view',

    CHATS_VIEW: 'chats:view',
    CHAT_VIEW: 'chat:view',
    CHAT_CREATE: 'chat:create',

    SETTINGS_VIEW: 'settings:view',

    OPTIMIZATION_RUN: 'optimization:run',
    OPTIMIZATION_VIEW: 'optimization:view',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const SIDEBAR_PERMISSIONS = {
    MY_PLAN: [
        PERMISSIONS.SCHEDULE_VIEW,
    ],

    EMPLOYEES: [
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEE_VIEW,
    ],

    FACILITIES: [
        PERMISSIONS.CAMPUSES_VIEW,
        PERMISSIONS.BUILDINGS_VIEW,
        PERMISSIONS.ROOMS_VIEW,
    ],

    STRUCTURES: [
        PERMISSIONS.FACULTIES_VIEW,
        PERMISSIONS.UNITS_VIEW,
    ],

    DIDACTICS: [
        PERMISSIONS.STUDY_FIELDS_VIEW,
        PERMISSIONS.COURSES_VIEW,
        PERMISSIONS.MAJORS_VIEW,
        PERMISSIONS.ELECTIVE_BLOCKS_VIEW,
        PERMISSIONS.STUDY_PROGRAMS_VIEW,
        PERMISSIONS.CURRICULUMS_VIEW,
    ],

    STUDENTS: [
        PERMISSIONS.STUDENTS_VIEW,
        PERMISSIONS.STUDENT_VIEW,
    ],

    PLANS: [
        PERMISSIONS.SCHEDULES_VIEW,
        PERMISSIONS.SCHEDULE_VIEW,
        PERMISSIONS.SCHEDULE_VIEW_OTHERS,
    ],

    CHAT: [
        PERMISSIONS.CHATS_VIEW,
        PERMISSIONS.CHAT_VIEW,
        PERMISSIONS.CHAT_CREATE,
    ],

    SUGGESTIONS: [
        PERMISSIONS.SUGGESTIONS_VIEW,
        PERMISSIONS.SUGGESTION_VIEW,
    ],

    PERMISSIONS: [
        PERMISSIONS.ROLES_VIEW,
        PERMISSIONS.PERMISSIONS_VIEW,
    ],

    USERS: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USER_VIEW,
    ],

    SETTINGS: [
        PERMISSIONS.SETTINGS_VIEW,
    ],

    GENERATE_SCHEDULE: [
        PERMISSIONS.SCHEDULE_GENERATE,
        PERMISSIONS.OPTIMIZATION_RUN,
    ],
} as const;