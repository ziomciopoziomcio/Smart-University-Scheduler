export const PERMISSIONS = {
    STUDENTS_VIEW: 'students:view',
    STUDENT_VIEW: 'student:view',
    STUDENT_CREATE: 'student:create',
    STUDENT_UPDATE: 'student:update',
    STUDENT_DELETE: 'student:delete',

    EMPLOYEES_VIEW: 'employees:view',
    EMPLOYEE_VIEW: 'employee:view',
    EMPLOYEE_CREATE: 'employee:create',
    EMPLOYEE_UPDATE: 'employee:update',
    EMPLOYEE_DELETE: 'employee:delete',

    UNITS_VIEW: 'units:view',
    UNIT_VIEW: 'unit:view',
    UNIT_CREATE: 'unit:create',
    UNIT_UPDATE: 'unit:update',
    UNIT_DELETE: 'unit:delete',

    GROUPS_VIEW: 'groups:view',
    GROUP_VIEW: 'group:view',
    GROUP_CREATE: 'group:create',
    GROUP_UPDATE: 'group:update',
    GROUP_DELETE: 'group:delete',

    GROUP_MEMBERS_VIEW: 'group-members:view',
    GROUP_MEMBER_VIEW: 'group-member:view',
    GROUP_MEMBER_CREATE: 'group-member:create',
    GROUP_MEMBER_UPDATE: 'group-member:update',
    GROUP_MEMBER_DELETE: 'group-member:delete',

    STUDY_FIELDS_VIEW: 'study-fields:view',
    STUDY_FIELD_VIEW: 'study-field:view',
    STUDY_FIELD_CREATE: 'study-field:create',
    STUDY_FIELD_UPDATE: 'study-field:update',
    STUDY_FIELD_DELETE: 'study-field:delete',

    MAJORS_VIEW: 'majors:view',
    MAJOR_VIEW: 'major:view',
    MAJOR_CREATE: 'major:create',
    MAJOR_UPDATE: 'major:update',
    MAJOR_DELETE: 'major:delete',

    ELECTIVE_BLOCKS_VIEW: 'elective-blocks:view',
    ELECTIVE_BLOCK_VIEW: 'elective-block:view',
    ELECTIVE_BLOCK_CREATE: 'elective-block:create',
    ELECTIVE_BLOCK_UPDATE: 'elective-block:update',
    ELECTIVE_BLOCK_DELETE: 'elective-block:delete',

    COURSE_TYPES_VIEW: 'course-types:view',
    COURSE_TYPE_VIEW: 'course-type:view',
    COURSE_TYPE_CREATE: 'course-type:create',
    COURSE_TYPE_UPDATE: 'course-type:update',
    COURSE_TYPE_DELETE: 'course-type:delete',

    INSTRUCTORS_VIEW: 'instructors:view',
    INSTRUCTOR_VIEW: 'instructor:view',
    INSTRUCTOR_CREATE: 'instructor:create',
    INSTRUCTOR_UPDATE: 'instructor:update',
    INSTRUCTOR_DELETE: 'instructor:delete',

    COURSES_VIEW: 'courses:view',
    COURSE_VIEW: 'course:view',
    COURSE_CREATE: 'course:create',
    COURSE_UPDATE: 'course:update',
    COURSE_DELETE: 'course:delete',

    STUDY_PROGRAMS_VIEW: 'study-programs:view',
    STUDY_PROGRAM_VIEW: 'study-program:view',
    STUDY_PROGRAM_CREATE: 'study-program:create',
    STUDY_PROGRAM_UPDATE: 'study-program:update',
    STUDY_PROGRAM_DELETE: 'study-program:delete',

    CURRICULUMS_VIEW: 'curriculums:view',
    CURRICULUM_VIEW: 'curriculum:view',
    CURRICULUM_CREATE: 'curriculum:create',
    CURRICULUM_UPDATE: 'curriculum:update',
    CURRICULUM_DELETE: 'curriculum:delete',

    CAMPUSES_VIEW: 'campuses:view',
    CAMPUS_VIEW: 'campus:view',
    CAMPUS_CREATE: 'campus:create',
    CAMPUS_UPDATE: 'campus:update',
    CAMPUS_DELETE: 'campus:delete',

    BUILDINGS_VIEW: 'buildings:view',
    BUILDING_VIEW: 'building:view',
    BUILDING_CREATE: 'building:create',
    BUILDING_UPDATE: 'building:update',
    BUILDING_DELETE: 'building:delete',

    ROOMS_VIEW: 'rooms:view',
    ROOM_VIEW: 'room:view',
    ROOM_CREATE: 'room:create',
    ROOM_UPDATE: 'room:update',
    ROOM_DELETE: 'room:delete',

    FACULTIES_VIEW: 'faculties:view',
    FACULTY_VIEW: 'faculty:view',
    FACULTY_CREATE: 'faculty:create',
    FACULTY_UPDATE: 'faculty:update',
    FACULTY_DELETE: 'faculty:delete',

    USER_LOGIN: 'user:login',
    USER_ME: 'user:me',
    USER_2FA_SETUP: 'user-2fa:setup',
    USER_2FA_CONFIRM: 'user-2fa:confirm',
    USER_2FA_DISABLE: 'user-2fa:disable',
    USER_2FA_VERIFY: 'user-2fa:verify',
    USER_PASSWORD_CHANGE: 'user:password-change',
    USER_API_KEY_GENERATE: 'api-key:generate',

    ROLES_VIEW: 'roles:view',
    ROLE_VIEW: 'role:view',
    ROLE_CREATE: 'role:create',
    ROLE_UPDATE: 'role:update',
    ROLE_DELETE: 'role:delete',

    USERS_VIEW: 'users:view',
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',

    SCHEDULE_GENERATE: 'schedule:generate',
    SCHEDULES_VIEW: 'schedules:view',
    SCHEDULE_VIEW_OTHERS: 'schedule:view_others',
    SCHEDULE_VIEW: 'schedule:view',
    SCHEDULE_DELETE: 'schedule:delete',
    SCHEDULE_PUBLISH: 'schedule:publish',
    SCHEDULE_EXPORT: 'schedule:export',

    COURSE_INSTRUCTOR_VIEW: 'course-instructor:view',
    COURSE_INSTRUCTOR_CREATE: 'course-instructor:create',
    COURSE_INSTRUCTOR_DELETE: 'course-instructor:delete',

    CLASS_SESSIONS_VIEW: 'class-sessions:view',
    CLASS_SESSION_VIEW: 'class-session:view',
    CLASS_SESSION_CREATE: 'class-session:create',
    CLASS_SESSION_UPDATE: 'class-session:update',
    CLASS_SESSION_DELETE: 'class-session:delete',

    SUGGESTIONS_VIEW: 'suggestions:view',
    SUGGESTION_VIEW: 'suggestion:view',
    SUGGESTION_CREATE: 'suggestion:create',
    SUGGESTION_UPDATE: 'suggestion:update',
    SUGGESTION_DELETE: 'suggestion:delete',
    SUGGESTION_APPROVE: 'suggestion:approve',
    SUGGESTION_REJECT: 'suggestion:reject',

    ABSENCES_VIEW: 'absences:view',
    ABSENCE_VIEW: 'absence:view',
    ABSENCE_CREATE: 'absence:create',
    ABSENCE_UPDATE: 'absence:update',
    ABSENCE_DELETE: 'absence:delete',

    PERMISSIONS_VIEW: 'permissions:view',
    PERMISSION_ADD_TO_ROLE: 'permission:add-to-role',
    PERMISSION_DELETE: 'permission:delete',

    CALENDAR_BULK_CREATE: 'calendar-bulk:create',
    CALENDAR_DAYS_VIEW: 'calendar-days:view',
    CALENDAR_DAY_VIEW: 'calendar-day:view',
    CALENDAR_DAY_CREATE: 'calendar-day:create',
    CALENDAR_DAY_UPDATE: 'calendar-day:update',
    CALENDAR_DAY_DELETE: 'calendar-day:delete',

    CHAT_CREATE: 'chat:create',
    CHATS_VIEW: 'chats:view',
    CHAT_VIEW: 'chat:view',
    CHAT_UPDATE: 'chat:update',
    CHAT_DELETE: 'chat:delete',

    MESSAGE_CREATE: 'message:create',
    MESSAGES_VIEW: 'messages:view',

    SETTINGS_CREATE: 'settings:create',
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_UPDATE: 'settings:update',
    SETTINGS_DELETE: 'settings:delete',

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

    DIDACTICS: {
        STUDY_FIELDS_BASE: [
            PERMISSIONS.STUDY_FIELDS_VIEW,
            PERMISSIONS.STUDY_FIELD_VIEW,
            PERMISSIONS.FACULTIES_VIEW,
            PERMISSIONS.FACULTY_VIEW,
        ],

        STUDY_FIELDS_INNER: [
            PERMISSIONS.STUDY_PROGRAMS_VIEW,
            PERMISSIONS.STUDY_PROGRAM_VIEW,

            PERMISSIONS.MAJORS_VIEW,
            PERMISSIONS.MAJOR_VIEW,

            PERMISSIONS.ELECTIVE_BLOCKS_VIEW,
            PERMISSIONS.ELECTIVE_BLOCK_VIEW,
        ],

        COURSES: [
            PERMISSIONS.UNITS_VIEW,
            PERMISSIONS.UNIT_VIEW,
            PERMISSIONS.COURSES_VIEW,
            PERMISSIONS.COURSE_VIEW,
        ],
    },

    STUDENTS: [
        PERMISSIONS.STUDENTS_VIEW,
    ],

    PLANS: [
        PERMISSIONS.SCHEDULES_VIEW,
    ],

    CHAT: [
        PERMISSIONS.CHAT_VIEW,
    ],

    SUGGESTIONS: [
        PERMISSIONS.SUGGESTIONS_VIEW,
    ],

    PERMISSIONS: [
        PERMISSIONS.ROLES_VIEW,
    ],

    USERS: [
        PERMISSIONS.USERS_VIEW,
    ],

    SETTINGS: [
        PERMISSIONS.SETTINGS_VIEW,
    ],

    GENERATE_SCHEDULE: [
        PERMISSIONS.SCHEDULE_GENERATE,
        PERMISSIONS.OPTIMIZATION_RUN,
    ],

    PUBLIC_API: [
        PERMISSIONS.USER_API_KEY_GENERATE,
    ],
} as const;