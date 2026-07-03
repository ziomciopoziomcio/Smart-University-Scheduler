import {
    type IntlShape,
} from 'react-intl';

import {
    type ScheduleSuggestion,
    type ScheduleSuggestionStatus,
    type SuggestionState,
    type SuggestionStateValue,
} from '@api/domains/schedules/suggestions';

export type SuggestionStatusFilter = ScheduleSuggestionStatus | 'ALL';

export function getStatusLabel(status: SuggestionStatusFilter, intl: IntlShape): string {
    const labels: Record<SuggestionStatusFilter, string> = {
        ALL: intl.formatMessage({id: 'suggestions.status.all'}),
        PENDING: intl.formatMessage({id: 'suggestions.status.pending'}),
        ACCEPTED: intl.formatMessage({id: 'suggestions.status.accepted'}),
        REJECTED: intl.formatMessage({id: 'suggestions.status.rejected'}),
        FAILED: intl.formatMessage({id: 'suggestions.status.failed'}),
    };

    return labels[status];
}

export interface NormalizedSuggestionSnapshot {
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    instructor: string;
    room: string;
    raw: SuggestionState;
}

export interface SuggestionField {
    key: string;
    label: string;
    beforeLabel?: string;
    afterLabel?: string;
    before: string;
    after: string;
}

function isPlainRecord(value: SuggestionStateValue): value is SuggestionState {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function pickValue(state: SuggestionState, keys: string[]): string {
    for (const key of keys) {
        const value = state[key];

        if (value !== undefined && value !== null && value !== '') {
            return formatSuggestionValue(value);
        }
    }

    return '';
}

function sortRecordKeys(value: SuggestionState): SuggestionState {
    return Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .reduce<SuggestionState>((result, key) => {
            const item = value[key];

            result[key] = isPlainRecord(item)
                ? sortRecordKeys(item)
                : Array.isArray(item)
                    ? item.map((entry) => isPlainRecord(entry) ? sortRecordKeys(entry) : entry)
                    : item;

            return result;
        }, {});
}

export function formatSuggestionValue(value: SuggestionStateValue): string {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (typeof value === 'number' || typeof value === 'string') {
        return String(value);
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '[]';
        }

        if (value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
            return value.map((item) => formatSuggestionValue(item)).join(', ');
        }

        return JSON.stringify(value, null, 2);
    }

    return JSON.stringify(sortRecordKeys(value), null, 2);
}

function flattenSuggestionState(
    state: SuggestionState,
    prefix = '',
): Record<string, string> {
    return Object.keys(state)
        .sort((a, b) => a.localeCompare(b))
        .reduce<Record<string, string>>((result, key) => {
            const value = state[key];
            const path = prefix ? `${prefix}.${key}` : key;

            if (isPlainRecord(value)) {
                const nested = flattenSuggestionState(value, path);

                if (Object.keys(nested).length === 0) {
                    result[path] = '{}';
                } else {
                    Object.assign(result, nested);
                }

                return result;
            }

            result[path] = formatSuggestionValue(value);

            return result;
        }, {});
}

function humanizePath(path: string): string {
    return path
        .replace(/\[(\d+)]/g, '.$1')
        .split('.')
        .filter(Boolean)
        .map((part) => part
            .replace(/_/g, ' ')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/^\w/, (letter) => letter.toUpperCase()))
        .join(' › ');
}

function getKnownFieldLabel(path: string, intl: IntlShape): string | null {
    const proposed = (label: string) => `Proposed ${label.charAt(0).toLowerCase()}${label.slice(1)}`;

    const labelByPath: Record<string, string> = {
        building: 'Building',
        buildingName: 'Building',
        building_name: 'Building',
        proposed_building: 'Proposed building',
        proposedBuilding: 'Proposed building',
        proposed_building_name: 'Proposed building',
        proposedBuildingName: 'Proposed building',
        new_building: 'Proposed building',
        newBuilding: 'Proposed building',
        new_building_name: 'Proposed building',
        newBuildingName: 'Proposed building',
        campus: 'Campus',
        campusName: 'Campus',
        campus_name: 'Campus',
        proposed_campus: 'Proposed campus',
        proposedCampus: 'Proposed campus',
        proposed_campus_name: 'Proposed campus',
        proposedCampusName: 'Proposed campus',
        new_campus: 'Proposed campus',
        newCampus: 'Proposed campus',
        new_campus_name: 'Proposed campus',
        newCampusName: 'Proposed campus',
        dayOfWeek: intl.formatMessage({id: 'suggestions.fields.dayOfWeek'}),
        day_of_week: intl.formatMessage({id: 'suggestions.fields.dayOfWeek'}),
        academic_day: intl.formatMessage({id: 'suggestions.fields.dayOfWeek'}),
        academicDay: intl.formatMessage({id: 'suggestions.fields.dayOfWeek'}),
        day: intl.formatMessage({id: 'suggestions.fields.dayOfWeek'}),
        proposed_day_of_week: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        proposedDayOfWeek: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        proposed_academic_day: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        proposedAcademicDay: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        proposed_day: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        proposedDay: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        new_day_of_week: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        newDayOfWeek: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        new_academic_day: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        newAcademicDay: proposed(intl.formatMessage({id: 'suggestions.fields.dayOfWeek'})),
        startTime: intl.formatMessage({id: 'suggestions.fields.startTime'}),
        start_time: intl.formatMessage({id: 'suggestions.fields.startTime'}),
        startsAt: intl.formatMessage({id: 'suggestions.fields.startTime'}),
        starts_at: intl.formatMessage({id: 'suggestions.fields.startTime'}),
        proposed_start_time: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        proposedStartTime: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        proposed_starts_at: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        proposedStartsAt: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        new_start_time: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        newStartTime: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        new_starts_at: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        newStartsAt: proposed(intl.formatMessage({id: 'suggestions.fields.startTime'})),
        endTime: intl.formatMessage({id: 'suggestions.fields.endTime'}),
        end_time: intl.formatMessage({id: 'suggestions.fields.endTime'}),
        endsAt: intl.formatMessage({id: 'suggestions.fields.endTime'}),
        ends_at: intl.formatMessage({id: 'suggestions.fields.endTime'}),
        proposed_end_time: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        proposedEndTime: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        proposed_ends_at: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        proposedEndsAt: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        new_end_time: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        newEndTime: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        new_ends_at: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        newEndsAt: proposed(intl.formatMessage({id: 'suggestions.fields.endTime'})),
        instructorName: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        instructor_name: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        instructorId: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        instructor_id: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        lecturer: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        lecturerName: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        lecturer_id: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        lecturerId: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        employeeName: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        employee_name: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        employeeId: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        employee_id: intl.formatMessage({id: 'suggestions.fields.instructor'}),
        room: 'Room label',
        roomLabel: 'Room label',
        room_label: 'Room label',
        roomName: 'Room label',
        room_name: 'Room label',
        roomId: 'Room label',
        room_id: 'Room label',
        proposed_room_label: 'Proposed room label',
        proposedRoomLabel: 'Proposed room label',
        proposed_room_name: 'Proposed room label',
        proposedRoomName: 'Proposed room label',
        proposed_room_id: 'Proposed room label',
        proposedRoomId: 'Proposed room label',
        new_room_label: 'Proposed room label',
        newRoomLabel: 'Proposed room label',
        new_room_name: 'Proposed room label',
        newRoomName: 'Proposed room label',
        new_room_id: 'Proposed room label',
        newRoomId: 'Proposed room label',
    };

    return labelByPath[path] ?? null;
}

export function normalizeSnapshot(state: SuggestionState): NormalizedSuggestionSnapshot {
    const roomName = pickValue(state, [
        'roomName',
        'room_name',
        'room',
        'proposed_room_name',
        'proposedRoomName',
    ]);

    const roomId = pickValue(state, [
        'roomId',
        'room_id',
        'proposed_room_id',
        'proposedRoomId',
        'new_room_id',
        'newRoomId',
    ]);

    const building = pickValue(state, [
        'building',
        'buildingName',
        'building_name',
    ]);

    const campus = pickValue(state, [
        'campus',
        'campusName',
        'campus_name',
    ]);

    const roomDetails = [
        roomName || (roomId ? `Room ID: ${roomId}` : ''),
        building ? `Building ${building}` : '',
        campus,
    ].filter(Boolean).join(' · ');

    return {
        title: pickValue(state, [
            'title',
            'courseName',
            'course_name',
            'subject',
            'name',
        ]) || 'Schedule session',
        dayOfWeek: pickValue(state, [
            'dayOfWeek',
            'day_of_week',
            'academic_day',
            'academicDay',
            'day',
        ]),
        startTime: pickValue(state, [
            'startTime',
            'start_time',
            'startsAt',
            'starts_at',
        ]),
        endTime: pickValue(state, [
            'endTime',
            'end_time',
            'endsAt',
            'ends_at',
        ]),
        instructor: pickValue(state, [
            'instructorName',
            'instructor_name',
            'lecturer',
            'lecturerName',
            'teacher',
            'employeeName',
            'employee_name',
        ]) || pickValue(state, [
            'instructorId',
            'instructor_id',
            'lecturerId',
            'lecturer_id',
            'employeeId',
            'employee_id',
        ]),
        room: roomDetails,
        raw: state,
    };
}

export function formatDate(value: string): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

const pairedDisplayFieldKeys = [
    {
        key: 'dayOfWeek',
        beforeKeys: ['dayOfWeek', 'day_of_week', 'academic_day', 'academicDay', 'day'],
        afterKeys: [
            'proposed_day_of_week',
            'proposedDayOfWeek',
            'proposed_academic_day',
            'proposedAcademicDay',
            'proposed_day',
            'proposedDay',
            'new_day_of_week',
            'newDayOfWeek',
            'new_academic_day',
            'newAcademicDay',
        ],
    },
    {
        key: 'startTime',
        beforeKeys: ['startTime', 'start_time', 'startsAt', 'starts_at'],
        afterKeys: [
            'proposed_start_time',
            'proposedStartTime',
            'proposed_starts_at',
            'proposedStartsAt',
            'new_start_time',
            'newStartTime',
            'new_starts_at',
            'newStartsAt',
        ],
    },
    {
        key: 'endTime',
        beforeKeys: ['endTime', 'end_time', 'endsAt', 'ends_at'],
        afterKeys: [
            'proposed_end_time',
            'proposedEndTime',
            'proposed_ends_at',
            'proposedEndsAt',
            'new_end_time',
            'newEndTime',
            'new_ends_at',
            'newEndsAt',
        ],
    },
    {
        key: 'campus',
        beforeKeys: ['campus', 'campusName', 'campus_name'],
        afterKeys: [
            'proposed_campus',
            'proposedCampus',
            'proposed_campus_name',
            'proposedCampusName',
            'new_campus',
            'newCampus',
            'new_campus_name',
            'newCampusName',
        ],
    },
    {
        key: 'building',
        beforeKeys: ['building', 'buildingName', 'building_name'],
        afterKeys: [
            'proposed_building',
            'proposedBuilding',
            'proposed_building_name',
            'proposedBuildingName',
            'new_building',
            'newBuilding',
            'new_building_name',
            'newBuildingName',
        ],
    },
    {
        key: 'roomLabel',
        beforeKeys: ['roomLabel', 'room_label', 'roomName', 'room_name', 'room', 'roomId', 'room_id'],
        afterKeys: [
            'proposed_room_label',
            'proposedRoomLabel',
            'proposed_room_name',
            'proposedRoomName',
            'proposed_room_id',
            'proposedRoomId',
            'new_room_label',
            'newRoomLabel',
            'new_room_name',
            'newRoomName',
            'new_room_id',
            'newRoomId',
        ],
    },
];

function firstExistingKey(fields: Record<string, string>, keys: string[]): string | undefined {
    return keys.find((key) => fields[key] !== undefined);
}

export function getAllDisplayFields(
    before: NormalizedSuggestionSnapshot,
    after: NormalizedSuggestionSnapshot,
    intl: IntlShape,
): SuggestionField[] {
    const beforeFields = flattenSuggestionState(before.raw);
    const afterFields = flattenSuggestionState(after.raw);
    const usedBeforeKeys = new Set<string>();
    const usedAfterKeys = new Set<string>();

    const pairedFields = pairedDisplayFieldKeys.flatMap<SuggestionField>((pair) => {
        const beforeKey = firstExistingKey(beforeFields, pair.beforeKeys);
        const afterKey = firstExistingKey(afterFields, pair.afterKeys);

        if (!beforeKey || !afterKey) {
            return [];
        }

        usedBeforeKeys.add(beforeKey);
        usedAfterKeys.add(afterKey);

        const beforeLabel = getKnownFieldLabel(beforeKey, intl) ?? humanizePath(beforeKey);
        const afterLabel = getKnownFieldLabel(afterKey, intl) ?? humanizePath(afterKey);

        return [{
            key: pair.key,
            label: beforeLabel,
            beforeLabel,
            afterLabel,
            before: beforeFields[beforeKey] ?? '',
            after: afterFields[afterKey] ?? '',
        }];
    });

    return [
        ...pairedFields
    ];
}

export function getChangedFields(
    before: NormalizedSuggestionSnapshot,
    after: NormalizedSuggestionSnapshot,
    intl: IntlShape,
): SuggestionField[] {
    return getAllDisplayFields(before, after, intl).filter((field) => {
        const beforeValue = field.before || '';
        const afterValue = field.after || '';

        return beforeValue !== afterValue;
    });
}

export function getSuggestionSearchText(
    suggestion: ScheduleSuggestion,
    intl: IntlShape,
): string {
    const before = normalizeSnapshot(suggestion.stateBefore);
    const after = normalizeSnapshot(suggestion.stateAfter);
    const fields = getAllDisplayFields(before, after, intl);

    return [
        before.title,
        after.title,
        before.dayOfWeek,
        after.dayOfWeek,
        before.startTime,
        after.startTime,
        before.endTime,
        after.endTime,
        before.instructor,
        after.instructor,
        before.room,
        after.room,
        suggestion.reason,
        suggestion.source,
        suggestion.targetClassSessionId,
        getStatusLabel(suggestion.status, intl),
        formatDate(suggestion.createdAt),
        suggestion.resolvedAt ? formatDate(suggestion.resolvedAt) : '',
        ...fields.flatMap((field) => [field.key, field.label, field.beforeLabel, field.afterLabel, field.before, field.after]),
        JSON.stringify(suggestion.stateBefore),
        JSON.stringify(suggestion.stateAfter),
    ].filter(Boolean).join(' ').toLowerCase();
}

export function matchesSuggestionSearch(
    suggestion: ScheduleSuggestion,
    searchQuery: string,
    intl: IntlShape,
): boolean {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
        return true;
    }

    return getSuggestionSearchText(suggestion, intl).includes(normalizedQuery);
}