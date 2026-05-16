import {
    type IntlShape,
} from 'react-intl';

import {
    type ScheduleSuggestion,
    type ScheduleSuggestionStatus,
    type SuggestionState,
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
    key: keyof NormalizedSuggestionSnapshot;
    label: string;
    before: string;
    after: string;
}

function pickValue(state: SuggestionState, keys: string[]): string {
    for (const key of keys) {
        const value = state[key];

        if (value !== undefined && value !== null && value !== '') {
            return String(value);
        }
    }

    return '';
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

export function getAllDisplayFields(
    before: NormalizedSuggestionSnapshot,
    after: NormalizedSuggestionSnapshot,
    intl: IntlShape,
): SuggestionField[] {
    const baseFields: SuggestionField[] = [
        {
            key: 'dayOfWeek',
            label: intl.formatMessage({id: 'suggestions.fields.dayOfWeek'}),
            before: before.dayOfWeek,
            after: after.dayOfWeek,
        },
        {
            key: 'startTime',
            label: intl.formatMessage({id: 'suggestions.fields.startTime'}),
            before: before.startTime,
            after: after.startTime,
        },
        {
            key: 'endTime',
            label: intl.formatMessage({id: 'suggestions.fields.endTime'}),
            before: before.endTime,
            after: after.endTime,
        },
        {
            key: 'instructor',
            label: intl.formatMessage({id: 'suggestions.fields.instructor'}),
            before: before.instructor,
            after: after.instructor,
        },
        {
            key: 'room',
            label: intl.formatMessage({id: 'suggestions.fields.room'}),
            before: before.room,
            after: after.room,
        },
    ];

    return baseFields.filter((field) => Boolean(field.before || field.after));
}

export function getChangedFields(
    before: NormalizedSuggestionSnapshot,
    after: NormalizedSuggestionSnapshot,
    intl: IntlShape,
): SuggestionField[] {
    return getAllDisplayFields(before, after, intl).filter((field) => {
        const beforeValue = field.before || '';
        const afterValue = field.after || '';

        return beforeValue !== afterValue && Boolean(beforeValue || afterValue);
    });
}

export function getSuggestionSearchText(
    suggestion: ScheduleSuggestion,
    intl: IntlShape,
): string {
    const before = normalizeSnapshot(suggestion.stateBefore);
    const after = normalizeSnapshot(suggestion.stateAfter);

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