import {SIDEBAR_PERMISSIONS, type PermissionCode} from '@constants/permissions';

type HasAnyPermission = (_permissions: readonly PermissionCode[]) => boolean;

export type AppSection =
    | 'MY_PLAN'
    | 'EMPLOYEES'
    | 'FACILITIES'
    | 'STRUCTURES'
    | 'DIDACTICS'
    | 'STUDENTS'
    | 'PLANS'
    | 'CHAT'
    | 'SUGGESTIONS'
    | 'PERMISSIONS'
    | 'USERS'
    | 'SETTINGS'
    | 'PUBLIC_API'
    | 'GENERATE_SCHEDULE';

export const SECTION_PATHS: Record<AppSection, string> = {
    MY_PLAN: '/plan',
    EMPLOYEES: '/employees',
    FACILITIES: '/facilities',
    STRUCTURES: '/structures',
    DIDACTICS: '/didactics',
    STUDENTS: '/students',
    PLANS: '/schedules',
    CHAT: '/chat',
    SUGGESTIONS: '/suggestions',
    PERMISSIONS: '/roles',
    USERS: '/users',
    SETTINGS: '/settings',
    PUBLIC_API: '/public-api',
    GENERATE_SCHEDULE: '/generate',
};

export const SECTION_ORDER: AppSection[] = [
    'MY_PLAN',
    'EMPLOYEES',
    'FACILITIES',
    'STRUCTURES',
    'DIDACTICS',
    'STUDENTS',
    'PLANS',
    'CHAT',
    'SUGGESTIONS',
    'PERMISSIONS',
    'USERS',
    'SETTINGS',
    'PUBLIC_API',
    'GENERATE_SCHEDULE',
];

export function canAccessDidactics(hasAnyPermission: HasAnyPermission): boolean {
    const {STUDY_FIELDS_BASE, STUDY_FIELDS_INNER, COURSES} =
        SIDEBAR_PERMISSIONS.DIDACTICS;

    return (
        hasAnyPermission(COURSES)
        ||
        hasAnyPermission(STUDY_FIELDS_BASE)
        ||
        hasAnyPermission(STUDY_FIELDS_INNER)
    );
}

export function canAccessSection(
    section: AppSection,
    hasAnyPermission: HasAnyPermission,
): boolean {
    if (section === 'DIDACTICS') {
        return canAccessDidactics(hasAnyPermission);
    }

    return hasAnyPermission(
        SIDEBAR_PERMISSIONS[section] as readonly PermissionCode[],
    );
}

export function getFirstAccessiblePath(
    hasAnyPermission: HasAnyPermission,
): string | null {
    const firstSection = SECTION_ORDER.find((section) =>
        canAccessSection(section, hasAnyPermission),
    );

    if (!firstSection) {
        return null;
    }

    return SECTION_PATHS[firstSection];
}