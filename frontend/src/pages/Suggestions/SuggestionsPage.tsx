import {useCallback, useMemo, useState, type ChangeEvent} from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
    type SelectChangeEvent,
} from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {useIntl, type IntlShape} from 'react-intl';

import {
    type ScheduleSuggestion,
    type ScheduleSuggestionStatus,
    type SuggestionState,
} from '@api/domains/schedules/suggestions';

// TODO: odkomentować po podpięciu backendu.
// import {
//     getScheduleSuggestions,
//     resolveScheduleSuggestion,
// } from '@api/domains/schedules/suggestions';

type SuggestionStatusFilter = ScheduleSuggestionStatus | 'ALL';

interface NormalizedSuggestionSnapshot {
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    instructor: string;
    room: string;
    raw: SuggestionState;
}

interface SuggestionField {
    key: keyof NormalizedSuggestionSnapshot;
    label: string;
    before: string;
    after: string;
}

const MOCK_SUGGESTIONS: ScheduleSuggestion[] = [
    {
        id: 1,
        source: 'RAG',
        reason: 'Sala jest za mała dla liczby studentów przypisanych do tej grupy.',
        targetClassSessionId: '8db87261-1020-42b2-9e9d-7f12b23a9101',
        status: 'PENDING',
        createdAt: '2026-05-13T08:40:00Z',
        resolvedAt: null,
        stateBefore: {
            title: 'Algorytmy i struktury danych',
            dayOfWeek: 'Monday',
            startTime: '08:00',
            endTime: '09:30',
            instructorName: 'dr Anna Kowalska',
            roomName: 'B-214',
            building: 'B',
            campus: 'Main Campus',
        },
        stateAfter: {
            title: 'Algorytmy i struktury danych',
            dayOfWeek: 'Monday',
            startTime: '10:00',
            endTime: '11:30',
            instructorName: 'dr Anna Kowalska',
            roomName: 'C-301',
            building: 'C',
            campus: 'Main Campus',
            proposed_room_id: 301,
        },
    },
    {
        id: 2,
        source: 'OPTIMIZER',
        reason: 'Propozycja zmniejsza konflikt prowadzącego między dwiema sesjami.',
        targetClassSessionId: '2fbe2bf3-f1bb-46aa-9349-a8492e19d3d2',
        status: 'PENDING',
        createdAt: '2026-05-13T09:15:00Z',
        resolvedAt: null,
        stateBefore: {
            title: 'Bazy danych',
            dayOfWeek: 'Wednesday',
            startTime: '12:00',
            endTime: '13:30',
            instructorName: 'prof. Jan Nowak',
            roomName: 'A-102',
            building: 'A',
            campus: 'Main Campus',
        },
        stateAfter: {
            title: 'Bazy danych',
            dayOfWeek: 'Thursday',
            startTime: '12:00',
            endTime: '13:30',
            instructorName: 'prof. Jan Nowak',
            roomName: 'A-102',
            building: 'A',
            campus: 'Main Campus',
        },
    },
    {
        id: 3,
        source: 'MANUAL_REVIEW',
        reason: 'Zmiana zaakceptowana wcześniej przez koordynatora.',
        targetClassSessionId: 'ffb8435e-cfc1-4bf3-91ef-62487f4e1c13',
        status: 'ACCEPTED',
        createdAt: '2026-05-12T11:30:00Z',
        resolvedAt: '2026-05-12T12:05:00Z',
        stateBefore: {
            title: 'Programowanie obiektowe',
            dayOfWeek: 'Friday',
            startTime: '14:00',
            endTime: '15:30',
            instructorName: 'mgr Piotr Zieliński',
            roomName: 'D-020',
            building: 'D',
            campus: 'South Campus',
        },
        stateAfter: {
            title: 'Programowanie obiektowe',
            dayOfWeek: 'Friday',
            startTime: '14:00',
            endTime: '15:30',
            instructorName: 'mgr Piotr Zieliński',
            roomName: 'D-118',
            building: 'D',
            campus: 'South Campus',
            proposed_room_id: 118,
        },
    },
];

const statusOptions: SuggestionStatusFilter[] = [
    'ALL',
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'FAILED',
];

const statusColors: Record<ScheduleSuggestionStatus, {
    color: string;
    background: string;
    border: string;
}> = {
    PENDING: {
        color: '#7A5A00',
        background: '#FFF7DF',
        border: '#FFE2A3',
    },
    ACCEPTED: {
        color: '#25643B',
        background: '#EAF7EF',
        border: '#BFE7CE',
    },
    REJECTED: {
        color: '#8E2B2B',
        background: '#FFF0F0',
        border: '#F4B8B8',
    },
    FAILED: {
        color: '#6B374C',
        background: '#FFF0F7',
        border: '#F2B6D0',
    },
};

function getStatusLabel(status: SuggestionStatusFilter, intl: IntlShape): string {
    const labels: Record<SuggestionStatusFilter, string> = {
        ALL: intl.formatMessage({id: 'suggestions.status.all'}),
        PENDING: intl.formatMessage({id: 'suggestions.status.pending'}),
        ACCEPTED: intl.formatMessage({id: 'suggestions.status.accepted'}),
        REJECTED: intl.formatMessage({id: 'suggestions.status.rejected'}),
        FAILED: intl.formatMessage({id: 'suggestions.status.failed'}),
    };

    return labels[status];
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

function normalizeSnapshot(state: SuggestionState): NormalizedSuggestionSnapshot {
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

function formatDate(value: string): string {
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

function getSuggestionSearchText(
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

function matchesSuggestionSearch(
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

function getChangedFields(
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

function getAllDisplayFields(
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

function StatusChip({status}: { status: ScheduleSuggestionStatus }) {
    const intl = useIntl();
    const palette = statusColors[status];

    return (
        <Chip
            label={getStatusLabel(status, intl)}
            size="small"
            sx={{
                height: 28,
                borderRadius: '999px',
                color: palette.color,
                bgcolor: palette.background,
                border: `1px solid ${palette.border}`,
                fontWeight: 700,
                '& .MuiChip-label': {
                    px: 1.4,
                },
            }}
        />
    );
}

function SuggestionsHero({
                             statusFilter,
                             onStatusFilterChange,
                             onRefresh,
                             loading,
                         }: {
    statusFilter: SuggestionStatusFilter;
    onStatusFilterChange: (event: SelectChangeEvent) => void;
    onRefresh: () => void;
    loading: boolean;
}) {
    const intl = useIntl();

    return (
        <Box
            sx={{
                px: {xs: 3, md: 5},
                py: {xs: 3.5, md: 4.5},
                borderRadius: '24px',
                background: '#ffffff',
                minHeight: {xs: 190, md: 220},
                display: 'flex',
                alignItems: {xs: 'flex-start', md: 'center'},
                justifyContent: 'space-between',
                gap: {xs: 3, md: 5},
                flexDirection: {xs: 'column', md: 'row'},
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: {xs: 3, md: 5},
                    width: '100%',
                }}
            >
                <InboxOutlinedIcon
                    sx={{
                        fontSize: {xs: 72, md: 96},
                        color: '#A8ADB7',
                        flexShrink: 0,
                    }}
                />

                <Box sx={{textAlign: 'left', minWidth: 0}}>
                    <Typography
                        sx={{
                            fontSize: {xs: 30, md: 40},
                            fontWeight: 700,
                            color: '#4F4F4F',
                            lineHeight: 1.08,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        {intl.formatMessage({id: 'suggestions.hero.title'})}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 1.4,
                            fontSize: {xs: 15, md: 16.5},
                            color: '#7A7A7A',
                            maxWidth: 720,
                            lineHeight: 1.6,
                        }}
                    >
                        {intl.formatMessage({id: 'suggestions.hero.description'})}
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    width: {xs: '100%', md: 'auto'},
                    p: 1,
                    borderRadius: '18px',
                    bgcolor: '#F8F9FC',
                    border: '1px solid #EEF1F6',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
            >
                <FormControl
                    size="small"
                    sx={{
                        minWidth: {xs: 1, md: 180},
                        flex: {xs: 1, md: 'unset'},
                        '& .MuiInputLabel-root': {
                            color: '#7A7A7A',
                            fontWeight: 600,
                        },
                    }}
                >
                    <InputLabel>{intl.formatMessage({id: 'suggestions.filters.status'})}</InputLabel>
                    <Select
                        value={statusFilter}
                        label={intl.formatMessage({id: 'suggestions.filters.status'})}
                        onChange={onStatusFilterChange}
                        sx={{
                            borderRadius: '14px',
                            bgcolor: '#FFFFFF',
                            fontWeight: 700,
                            color: '#4F5E82',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#DDE3EF',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#C8D0E0',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#4F5E82',
                            },
                        }}
                    >
                        {statusOptions.map((status) => (
                            <MenuItem key={status} value={status}>
                                {getStatusLabel(status, intl)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16}/> : <RefreshRoundedIcon/>}
                    onClick={onRefresh}
                    disabled={loading}
                    sx={{
                        height: 40,
                        px: 2.2,
                        borderRadius: '14px',
                        textTransform: 'none',
                        color: '#4F5E82',
                        borderColor: '#DDE3EF',
                        bgcolor: '#FFFFFF',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(79, 94, 130, 0.08)',
                        '&:hover': {
                            borderColor: '#BFC7DA',
                            bgcolor: '#FDFEFF',
                            boxShadow: '0 6px 16px rgba(79, 94, 130, 0.12)',
                        },
                    }}
                >
                    {intl.formatMessage({id: 'suggestions.actions.refresh'})}
                </Button>
            </Box>
        </Box>
    );
}

function SuggestionListItem({
                                suggestion,
                                selected,
                                onClick,
                            }: {
    suggestion: ScheduleSuggestion;
    selected: boolean;
    onClick: () => void;
}) {
    const intl = useIntl();
    const before = normalizeSnapshot(suggestion.stateBefore);
    const after = normalizeSnapshot(suggestion.stateAfter);
    const changedFields = getChangedFields(before, after, intl);

    return (
        <Box
            onClick={onClick}
            sx={{
                p: 2,
                cursor: 'pointer',
                borderRadius: '18px',
                border: selected ? '1px solid #D6DBE8' : '1px solid transparent',
                bgcolor: selected ? '#F7F9FD' : '#FFFFFF',
                transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                '&:hover': {
                    bgcolor: '#F7F9FD',
                    borderColor: '#E1E5EF',
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5}}>
                <Box sx={{minWidth: 0, textAlign: 'left'}}>
                    <Typography
                        sx={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#454545',
                            lineHeight: 1.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                        }}
                    >
                        {after.title || before.title}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.6,
                            fontSize: 13.5,
                            color: '#8A8A8A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                        }}
                    >
                        {suggestion.reason || intl.formatMessage({id: 'suggestions.details.noReason'})}
                    </Typography>
                </Box>

                <StatusChip status={suggestion.status}/>
            </Box>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 1.6, flexWrap: 'wrap'}}>
                <Chip
                    label={intl.formatMessage(
                        {id: 'suggestions.queue.changesCount'},
                        {count: changedFields.length},
                    )}
                    size="small"
                    sx={{
                        height: 24,
                        borderRadius: '999px',
                        bgcolor: changedFields.length > 0 ? '#FFF1F1' : '#F1F3F8',
                        color: changedFields.length > 0 ? '#A94444' : '#687085',
                        fontWeight: 600,
                        fontSize: 12,
                    }}
                />

                <Typography sx={{ml: 'auto', fontSize: 12.5, color: '#9A9A9A'}}>
                    {formatDate(suggestion.createdAt)}
                </Typography>
            </Box>
        </Box>
    );
}

function ReadonlySuggestionField({
                                     label,
                                     value,
                                     changed,
                                     variant,
                                 }: {
    label: string;
    value: string;
    changed: boolean;
    variant: 'before' | 'after';
}) {
    const isAfter = variant === 'after';

    return (
        <TextField
            fullWidth
            label={label}
            value={value || '—'}
            InputProps={{
                readOnly: true,
            }}
            InputLabelProps={{shrink: true}}
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: changed && isAfter ? '#e1e6ed' : '#FBFCFF',
                    color: '#4F4F4F',
                    fontWeight: changed && isAfter ? 700 : 500,
                    '& fieldset': {
                        borderColor: changed && isAfter ? '#03557e' : '#E1E5EF',
                        borderWidth: changed && isAfter ? 2 : 1,
                    },
                    '&:hover fieldset': {
                        borderColor: changed && isAfter ? '#03557e' : '#C8D0E0',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: changed && isAfter ? '#03557e' : '#4F5E82',
                    },
                },
                '& .MuiInputLabel-root': {
                    color: changed && isAfter ? '#03557e' : '#7A7A7A',
                    fontWeight: changed && isAfter ? 700 : 600,
                },
            }}
        />
    );
}

function SuggestionChangeRow({field}: { field: SuggestionField }) {
    const changed = field.before !== field.after;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {xs: '1fr', md: 'minmax(0, 1fr) 44px minmax(0, 1fr)'},
                gap: {xs: 1.2, md: 1.5},
                alignItems: 'center',
            }}
        >
            <ReadonlySuggestionField
                label={field.label}
                value={field.before}
                changed={changed}
                variant="before"
            />

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: {xs: 24, md: 56},
                    transform: {xs: 'rotate(90deg)', md: 'none'},
                }}
            >
                <Box
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '999px',
                        color: changed ? '#03557e' : '#687085',
                        opacity: changed ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ArrowForwardRoundedIcon sx={{fontSize: 20}}/>
                </Box>
            </Box>

            <ReadonlySuggestionField
                label={field.label}
                value={field.after}
                changed={changed}
                variant="after"
            />
        </Box>
    );
}

function SuggestionDetails({
                               suggestion,
                               onResolve,
                               resolving,
                           }: {
    suggestion: ScheduleSuggestion | null;
    onResolve: (status: 'ACCEPTED' | 'REJECTED') => Promise<void>;
    resolving: boolean;
}) {
    const intl = useIntl();

    const before = useMemo(
        () => suggestion ? normalizeSnapshot(suggestion.stateBefore) : null,
        [suggestion],
    );

    const after = useMemo(
        () => suggestion ? normalizeSnapshot(suggestion.stateAfter) : null,
        [suggestion],
    );

    const fields = useMemo(
        () => before && after ? getAllDisplayFields(before, after, intl) : [],
        [before, after, intl],
    );

    const changedFields = useMemo(
        () => before && after ? getChangedFields(before, after, intl) : [],
        [before, after, intl],
    );

    if (!suggestion || !before || !after) {
        return (
            <Box
                sx={{
                    height: '100%',
                    minHeight: 420,
                    borderRadius: '24px',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 3,
                    textAlign: 'center',
                }}
            >
                <Box>
                    <CompareArrowsIcon sx={{fontSize: 54, color: '#C5CAD4', mb: 1}}/>
                    <Typography sx={{fontSize: 20, fontWeight: 700, color: '#666666'}}>
                        {intl.formatMessage({id: 'suggestions.empty.selectTitle'})}
                    </Typography>
                    <Typography sx={{mt: 0.8, fontSize: 14.5, color: '#8A8A8A'}}>
                        {intl.formatMessage({id: 'suggestions.empty.selectDescription'})}
                    </Typography>
                </Box>
            </Box>
        );
    }

    const title = after.title || before.title;

    return (
        <Box
            sx={{
                borderRadius: '24px',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
            }}
        >
            <Box sx={{p: {xs: 3, md: 4}}}>
                <Box sx={{textAlign: 'left', mb: 3}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap'}}>
                        <Typography
                            sx={{
                                fontSize: {xs: 25, md: 30},
                                fontWeight: 700,
                                color: '#4F4F4F',
                                lineHeight: 1.1,
                                textAlign: 'left',
                            }}
                        >
                            {title}
                        </Typography>

                        <StatusChip status={suggestion.status}/>
                    </Box>

                    <Typography sx={{mt: 0.8, fontSize: 13, color: '#A0A0A0', textAlign: 'left'}}>
                        {intl.formatMessage(
                            {id: 'suggestions.details.targetSession'},
                            {id: suggestion.targetClassSessionId},
                        )}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        mb: 4,
                        p: 2,
                        borderRadius: '18px',
                        bgcolor: '#F8F9FC',
                        border: '1px solid #EEF1F6',
                    }}
                >
                    <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap'}}>
                        <Box sx={{textAlign: 'left'}}>
                            <Typography
                                sx={{fontSize: 13, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase'}}>
                                {intl.formatMessage({id: 'suggestions.details.reason'})}
                            </Typography>
                            <Typography sx={{mt: 0.6, fontSize: 15, color: '#555555', lineHeight: 1.5}}>
                                {suggestion.reason || intl.formatMessage({id: 'suggestions.details.noReason'})}
                            </Typography>
                        </Box>

                        <Box sx={{display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap'}}>
                            <Chip
                                label={intl.formatMessage(
                                    {id: 'suggestions.details.source'},
                                    {source: suggestion.source},
                                )}
                                sx={{
                                    borderRadius: '999px',
                                    bgcolor: '#FFFFFF',
                                    border: '1px solid #E6EAF2',
                                    color: '#687085',
                                    fontWeight: 700,
                                }}
                            />
                            <Chip
                                label={intl.formatMessage(
                                    {id: 'suggestions.details.changedFields'},
                                    {count: changedFields.length},
                                )}
                                sx={{
                                    borderRadius: '999px',
                                    bgcolor: '#FFF1F1',
                                    border: '1px solid #F4C3C3',
                                    color: '#A94444',
                                    fontWeight: 700,
                                }}
                            />
                        </Box>
                    </Box>
                </Box>

                {fields.length === 0 && (
                    <Alert severity="warning" sx={{mb: 2, borderRadius: '16px'}}>
                        {intl.formatMessage({id: 'suggestions.details.unrecognizedPayload'})}
                    </Alert>
                )}

                <Stack spacing={2.2}>
                    <Stack spacing={2}>
                        {fields.map((field) => (
                            <SuggestionChangeRow
                                key={field.key}
                                field={field}
                            />
                        ))}
                    </Stack>

                    <Divider sx={{pt: 0.8}}/>

                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}, gap: 2}}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: '18px',
                                bgcolor: '#FBFCFF',
                                border: '1px solid #EEF1F6',
                                textAlign: 'left',
                            }}
                        >
                            <Typography sx={{fontSize: 13, fontWeight: 800, color: '#6B7280', mb: 1}}>
                                {intl.formatMessage({id: 'suggestions.details.created'})}
                            </Typography>
                            <Typography sx={{fontSize: 14.5, color: '#555555'}}>
                                {formatDate(suggestion.createdAt)}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: '18px',
                                bgcolor: '#FBFCFF',
                                border: '1px solid #EEF1F6',
                                textAlign: 'left',
                            }}
                        >
                            <Typography sx={{fontSize: 13, fontWeight: 800, color: '#6B7280', mb: 1}}>
                                {intl.formatMessage({id: 'suggestions.details.resolved'})}
                            </Typography>
                            <Typography sx={{fontSize: 14.5, color: '#555555'}}>
                                {suggestion.resolvedAt ? formatDate(suggestion.resolvedAt) : '—'}
                            </Typography>
                        </Box>
                    </Box>

                    {suggestion.status === 'PENDING' && (
                        <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1, flexWrap: 'wrap'}}>
                            <Tooltip title={intl.formatMessage({id: 'suggestions.actions.rejectTooltip'})}>
                                <span>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CloseRoundedIcon/>}
                                        onClick={() => void onResolve('REJECTED')}
                                        disabled={resolving}
                                        sx={{
                                            height: 48,
                                            px: 3,
                                            borderRadius: '15px',
                                            textTransform: 'none',
                                            color: '#A94444',
                                            borderColor: '#E0A0A0',
                                            fontWeight: 800,
                                            '&:hover': {
                                                borderColor: '#D45F5F',
                                                bgcolor: '#FFF8F8',
                                            },
                                        }}
                                    >
                                        {intl.formatMessage({id: 'suggestions.actions.reject'})}
                                    </Button>
                                </span>
                            </Tooltip>

                            <Tooltip title={intl.formatMessage({id: 'suggestions.actions.acceptTooltip'})}>
                                <span>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CheckRoundedIcon/>}
                                        onClick={() => void onResolve('ACCEPTED')}
                                        disabled={resolving}
                                        sx={{
                                            height: 48,
                                            px: 3.5,
                                            borderRadius: '15px',
                                            textTransform: 'none',
                                            color: '#2F8F5B',
                                            borderColor: '#8BC8A6',
                                            bgcolor: '#FFFFFF',
                                            fontWeight: 800,
                                            '&:hover': {
                                                borderColor: '#2F8F5B',
                                                bgcolor: '#F2FBF6',
                                            },
                                            '&.Mui-disabled': {
                                                color: '#8FBBA2',
                                                borderColor: '#CDE6D7',
                                                bgcolor: '#FFFFFF',
                                            },
                                        }}
                                    >
                                        {resolving
                                            ? intl.formatMessage({id: 'suggestions.actions.saving'})
                                            : intl.formatMessage({id: 'suggestions.actions.accept'})}
                                    </Button>
                                </span>
                            </Tooltip>
                        </Box>
                    )}

                    {suggestion.status !== 'PENDING' && (
                        <Alert severity="info" sx={{borderRadius: '16px'}}>
                            {intl.formatMessage({id: 'suggestions.details.alreadyResolved'})}
                        </Alert>
                    )}
                </Stack>
            </Box>
        </Box>
    );
}

export default function SuggestionsPage() {
    const intl = useIntl();

    const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>(MOCK_SUGGESTIONS);
    const [selectedId, setSelectedId] = useState<number | null>(MOCK_SUGGESTIONS[0]?.id ?? null);
    const [statusFilter, setStatusFilter] = useState<SuggestionStatusFilter>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const filteredSuggestions = useMemo(() => {
        return suggestions.filter((suggestion) => {
            const matchesStatus = statusFilter === 'ALL' || suggestion.status === statusFilter;
            const matchesSearch = matchesSuggestionSearch(suggestion, searchQuery, intl);

            return matchesStatus && matchesSearch;
        });
    }, [intl, searchQuery, suggestions, statusFilter]);

    const selectedSuggestion = useMemo(
        () => filteredSuggestions.find((suggestion) => suggestion.id === selectedId) ?? filteredSuggestions[0] ?? null,
        [selectedId, filteredSuggestions],
    );

    const loadSuggestions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await new Promise((resolve) => {
                window.setTimeout(resolve, 300);
            });

            setSuggestions(MOCK_SUGGESTIONS);

            const nextSuggestions = MOCK_SUGGESTIONS.filter((suggestion) => {
                const matchesStatus = statusFilter === 'ALL' || suggestion.status === statusFilter;
                const matchesSearch = matchesSuggestionSearch(suggestion, searchQuery, intl);

                return matchesStatus && matchesSearch;
            });

            setSelectedId((currentSelectedId) => {
                if (nextSuggestions.length === 0) {
                    return null;
                }

                const currentStillExists = nextSuggestions.some((item) => item.id === currentSelectedId);

                return currentStillExists ? currentSelectedId : nextSuggestions[0].id;
            });

            // TODO: prawdziwy fetch na później.
            //
            // const response = await getScheduleSuggestions({
            //     status: statusFilter === 'ALL' ? undefined : statusFilter,
            //     search: searchQuery.trim() || undefined,
            //     limit: 50,
            //     offset: 0,
            // });
            //
            // setSuggestions(response.items);
            //
            // setSelectedId((currentSelectedId) => {
            //     if (response.items.length === 0) {
            //         return null;
            //     }
            //
            //     const currentStillExists = response.items.some((item) => item.id === currentSelectedId);
            //
            //     return currentStillExists ? currentSelectedId : response.items[0].id;
            // });
        } catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : intl.formatMessage({id: 'suggestions.errors.load'}));
        } finally {
            setLoading(false);
        }
    }, [intl, searchQuery, statusFilter]);

    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        const nextStatus = event.target.value as SuggestionStatusFilter;

        setStatusFilter(nextStatus);

        const nextSuggestions = suggestions.filter((suggestion) => {
            const matchesStatus = nextStatus === 'ALL' || suggestion.status === nextStatus;
            const matchesSearch = matchesSuggestionSearch(suggestion, searchQuery, intl);

            return matchesStatus && matchesSearch;
        });

        setSelectedId(nextSuggestions[0]?.id ?? null);
    };

    const handleSearchQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextSearchQuery = event.target.value;

        setSearchQuery(nextSearchQuery);

        const nextSuggestions = suggestions.filter((suggestion) => {
            const matchesStatus = statusFilter === 'ALL' || suggestion.status === statusFilter;
            const matchesSearch = matchesSuggestionSearch(suggestion, nextSearchQuery, intl);

            return matchesStatus && matchesSearch;
        });

        setSelectedId((currentSelectedId) => {
            if (nextSuggestions.length === 0) {
                return null;
            }

            const currentStillExists = nextSuggestions.some((suggestion) => suggestion.id === currentSelectedId);

            return currentStillExists ? currentSelectedId : nextSuggestions[0].id;
        });
    };

    const handleResolve = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!selectedSuggestion) {
            return;
        }

        setResolvingId(selectedSuggestion.id);
        setError(null);

        try {
            await new Promise((resolve) => {
                window.setTimeout(resolve, 300);
            });

            const updatedSuggestion: ScheduleSuggestion = {
                ...selectedSuggestion,
                status,
                resolvedAt: new Date().toISOString(),
            };

            setSuggestions((current) => current.map((suggestion) => (
                suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion
            )));

            // TODO: prawdziwy request na później.
            //
            // const updatedSuggestion = await resolveScheduleSuggestion(selectedSuggestion.id, {status});
            //
            // setSuggestions((current) => current.map((suggestion) => (
            //     suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion
            // )));
        } catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : intl.formatMessage({id: 'suggestions.errors.resolve'}));
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <Box sx={{width: '100%', gap: 2, flexDirection: 'column', display: 'flex'}}>
            <SuggestionsHero
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                onRefresh={() => void loadSuggestions()}
                loading={loading}
            />

            {error && (
                <Alert severity="error" sx={{borderRadius: '16px'}}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: '1fr', lg: '390px minmax(0, 1fr)'},
                    gap: 2,
                    alignItems: 'start',
                }}
            >
                <Box
                    sx={{
                        borderRadius: '24px',
                        bgcolor: '#FFFFFF',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                        p: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1.5,
                            px: 0.5,
                        }}
                    >
                        <Typography sx={{fontSize: 18, fontWeight: 800, color: '#4F4F4F', textAlign: 'left'}}>
                            {intl.formatMessage({id: 'suggestions.queue.title'})}
                        </Typography>
                        <Typography sx={{fontSize: 13.5, color: '#8A8A8A'}}>
                            {intl.formatMessage(
                                {id: 'suggestions.queue.itemsCount'},
                                {count: filteredSuggestions.length},
                            )}
                        </Typography>
                    </Box>

                    <TextField
                        fullWidth
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchQueryChange}
                        placeholder={intl.formatMessage({id: 'suggestions.queue.searchPlaceholder'})}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon sx={{fontSize: 20, color: '#8A94A8'}}/>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            mb: 1.5,
                            '& .MuiOutlinedInput-root': {
                                height: 42,
                                borderRadius: '14px',
                                bgcolor: '#FBFCFF',
                                color: '#4F4F4F',
                                fontWeight: 600,
                                '& fieldset': {
                                    borderColor: '#E1E5EF',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#C8D0E0',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#4F5E82',
                                },
                            },
                            '& input::placeholder': {
                                color: '#9AA3B5',
                                opacity: 1,
                                fontWeight: 500,
                            },
                        }}
                    />

                    {loading && filteredSuggestions.length === 0 && (
                        <Box sx={{py: 8, display: 'flex', justifyContent: 'center'}}>
                            <CircularProgress/>
                        </Box>
                    )}

                    {!loading && filteredSuggestions.length === 0 && (
                        <Box sx={{py: 7, px: 2, textAlign: 'center'}}>
                            <CompareArrowsIcon sx={{fontSize: 48, color: '#C5CAD4', mb: 1}}/>
                            <Typography sx={{fontSize: 18, fontWeight: 700, color: '#666666'}}>
                                {intl.formatMessage({id: 'suggestions.empty.noSuggestionsTitle'})}
                            </Typography>
                            <Typography sx={{mt: 0.8, fontSize: 14, color: '#8A8A8A'}}>
                                {intl.formatMessage({id: 'suggestions.empty.noSuggestionsDescription'})}
                            </Typography>
                        </Box>
                    )}

                    <Stack spacing={1}>
                        {filteredSuggestions.map((suggestion) => (
                            <SuggestionListItem
                                key={suggestion.id}
                                suggestion={suggestion}
                                selected={selectedSuggestion?.id === suggestion.id}
                                onClick={() => {
                                    setSelectedId(suggestion.id);
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                <SuggestionDetails
                    suggestion={selectedSuggestion}
                    onResolve={handleResolve}
                    resolving={Boolean(selectedSuggestion && resolvingId === selectedSuggestion.id)}
                />
            </Box>
        </Box>
    );
}