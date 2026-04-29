import {Box, Typography} from '@mui/material';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {useIntl} from 'react-intl';

import {SCHEDULE_LAYOUT, scheduleHours, weekdayMessageIds} from '@constants/schedule';
import {ScheduleTileFactory} from './Tile/ScheduleTileFactory';
import {SubjectDetailsPopup} from './SubjectDetailsPopup';
import {EditScheduleSessionPopup} from './EditScheduleSessionPopup';
import {formatMinutesToTimeLabel, getGridHeight, parseTimeToMinutes} from './utils/utils';
import {getDayIndexFromDate, parseIsoDate} from './utils/dateUtils';

import type {
    DayOfWeek,
    ScheduleEntry,
    ScheduleEntryDetails,
    UpdateScheduleSessionRequest,
} from '@api';
import {updateScheduleSession} from '@api'; //TODO: IT DOES NOT WORK  // https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/223

// TODO: uncomment when backend endpoint is ready
// import {fetchCourseSessionDetails} from '@api';

interface WeekScheduleGridProps {
    entries: ScheduleEntry[];
    onSessionUpdated?: () => void | Promise<void>;
}

interface EntryLayout {
    columnIndex: number;
    columnCount: number;
}

interface EditInitialValues {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    instructorId: number;
    roomId: number;
    applyOnce: boolean;
}

interface DragPreviewState {
    entry: ScheduleEntry;
    pointerX: number;
    pointerY: number;
    initialPointerX: number;
    initialPointerY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    hasMoved: boolean;
}

interface DropPreviewState {
    dayIndex: number;
    top: number;
    height: number;
    startTime: string;
    endTime: string;
}

const DRAG_SNAP_MINUTES = 15;
const TIME_GRID_STEP_MINUTES = 15;
const DRAG_START_THRESHOLD_PX = 6;

const dayOfWeekByIndex: DayOfWeek[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
];

const MOCK_DEFAULT_INSTRUCTOR_ID = 42;
const MOCK_DEFAULT_ROOM_ID = 18;

const mockedInstructors = [
    {id: 42, name: 'dr Anna Kowalska'},
    {id: 43, name: 'prof. Jan Nowak'},
    {id: 44, name: 'mgr Piotr Zieliński'},
    {id: 45, name: 'dr hab. Katarzyna Wiśniewska'},
];

const mockedRooms = [
    {id: 18, name: 'B-214', building: 'B', campus: 'Główny'},
    {id: 19, name: 'A-101', building: 'A', campus: 'Główny'},
    {id: 20, name: 'C-12', building: 'C', campus: 'Technologiczny'},
    {id: 21, name: 'Lab-03', building: 'D', campus: 'Technologiczny'},
];

const getMockedCourseSessionDetails = (entry: ScheduleEntry): ScheduleEntryDetails => ({
    typeLabel: entry.variant,
    timeLabel: `${entry.startTime} - ${entry.endTime}`,
    location: {
        campus: 'Główny',
        building: 'B',
        room: 'B-214',
    },
    lecturer: 'dr Anna Kowalska',
    audience: [
        {
            fieldOfStudy: 'Informatyka',
            semester: 'Semestr 3',
            specialization: 'Systemy informatyczne',
        },
    ],
});

function doEntriesOverlap(left: ScheduleEntry, right: ScheduleEntry) {
    const leftStart = parseTimeToMinutes(left.startTime);
    const leftEnd = parseTimeToMinutes(left.endTime);
    const rightStart = parseTimeToMinutes(right.startTime);
    const rightEnd = parseTimeToMinutes(right.endTime);

    return leftStart < rightEnd && rightStart < leftEnd;
}

function getEntryLayouts(entries: ScheduleEntry[]): Record<string, EntryLayout> {
    const layouts: Record<string, EntryLayout> = {};
    const entriesByDay = new Map<number, ScheduleEntry[]>();

    for (const entry of entries) {
        const entryDate = parseIsoDate(entry.date);
        const dayIndex = getDayIndexFromDate(entryDate);

        if (!entriesByDay.has(dayIndex)) {
            entriesByDay.set(dayIndex, []);
        }

        entriesByDay.get(dayIndex)!.push(entry);
    }

    for (const [, dayEntries] of entriesByDay) {
        const sorted = [...dayEntries].sort((a, b) => {
            const startDiff = parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);

            if (startDiff !== 0) {
                return startDiff;
            }

            return parseTimeToMinutes(a.endTime) - parseTimeToMinutes(b.endTime);
        });

        const clusters: ScheduleEntry[][] = [];
        let currentCluster: ScheduleEntry[] = [];
        let currentClusterEnd = -1;

        for (const entry of sorted) {
            const start = parseTimeToMinutes(entry.startTime);
            const end = parseTimeToMinutes(entry.endTime);

            if (currentCluster.length === 0) {
                currentCluster = [entry];
                currentClusterEnd = end;
                continue;
            }

            if (start < currentClusterEnd) {
                currentCluster.push(entry);
                currentClusterEnd = Math.max(currentClusterEnd, end);
            } else {
                clusters.push(currentCluster);
                currentCluster = [entry];
                currentClusterEnd = end;
            }
        }

        if (currentCluster.length > 0) {
            clusters.push(currentCluster);
        }

        for (const cluster of clusters) {
            const columns: ScheduleEntry[][] = [];

            for (const entry of cluster) {
                let assignedColumnIndex = -1;

                for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
                    const column = columns[columnIndex];
                    const lastEntryInColumn = column[column.length - 1];

                    if (!doEntriesOverlap(lastEntryInColumn, entry)) {
                        column.push(entry);
                        assignedColumnIndex = columnIndex;
                        break;
                    }
                }

                if (assignedColumnIndex === -1) {
                    columns.push([entry]);
                    assignedColumnIndex = columns.length - 1;
                }

                layouts[entry.id] = {
                    columnIndex: assignedColumnIndex,
                    columnCount: 1,
                };
            }

            const columnCount = columns.length;

            for (const entry of cluster) {
                layouts[entry.id] = {
                    ...layouts[entry.id],
                    columnCount,
                };
            }
        }
    }

    return layouts;
}

const formatMinutesToInputTime = (minutes: number) => {
    const normalizedMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
    const hours = Math.floor(normalizedMinutes / 60);
    const mins = normalizedMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const snapMinutes = (minutes: number) => {
    return Math.round(minutes / DRAG_SNAP_MINUTES) * DRAG_SNAP_MINUTES;
};

export function WeekScheduleGrid({entries, onSessionUpdated}: WeekScheduleGridProps) {
    const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<ScheduleEntryDetails | null>(null);

    const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null);
    const [editInitialValues, setEditInitialValues] = useState<EditInitialValues | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
    const [dropPreview, setDropPreview] = useState<DropPreviewState | null>(null);

    const detailsRequestId = useRef(0);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const suppressNextClickRef = useRef(false);

    const {formatMessage} = useIntl();
    const gridHeight = getGridHeight();

    const orderedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            const dateDiff = a.date.localeCompare(b.date);

            if (dateDiff !== 0) {
                return dateDiff;
            }

            return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
        });
    }, [entries]);

    const entryLayouts = useMemo(() => {
        return getEntryLayouts(orderedEntries);
    }, [orderedEntries]);

    const getGridTopFromMinutes = (minutes: number) => {
        const startHour = scheduleHours[0] ?? 8;

        return ((minutes - startHour * 60) / 60) * SCHEDULE_LAYOUT.hourRowHeight;
    };

    const getTimeGridMarkers = () => {
        const startHour = scheduleHours[0] ?? 8;
        const endHour = scheduleHours[scheduleHours.length - 1] ?? 20;

        const markers: number[] = [];

        for (
            let minutes = startHour * 60;
            minutes <= endHour * 60;
            minutes += TIME_GRID_STEP_MINUTES
        ) {
            markers.push(minutes);
        }

        return markers;
    };

    const getDropPreviewFromPointer = (
        clientX: number,
        clientY: number,
        preview: DragPreviewState,
    ): DropPreviewState | null => {
        const gridElement = gridRef.current;

        if (!gridElement) {
            return null;
        }

        const rect = gridElement.getBoundingClientRect();

        const draggedTileLeft = clientX - rect.left - preview.offsetX;
        const draggedTileTop = clientY - rect.top - preview.offsetY;
        const draggedTileCenterX = draggedTileLeft + preview.width / 2;

        if (
            draggedTileCenterX < 0 ||
            draggedTileCenterX > rect.width ||
            draggedTileTop < 0 ||
            draggedTileTop + preview.height > gridHeight
        ) {
            return null;
        }

        const dayIndex = Math.max(
            0,
            Math.min(
                SCHEDULE_LAYOUT.dayCount - 1,
                Math.floor((draggedTileCenterX / rect.width) * SCHEDULE_LAYOUT.dayCount),
            ),
        );

        const startHour = scheduleHours[0] ?? 8;
        const endHour = scheduleHours[scheduleHours.length - 1] ?? 20;

        const duration = parseTimeToMinutes(preview.entry.endTime) - parseTimeToMinutes(preview.entry.startTime);
        const rawStartMinutes = startHour * 60 + (draggedTileTop / SCHEDULE_LAYOUT.hourRowHeight) * 60;

        const newStartMinutes = Math.max(
            startHour * 60,
            Math.min(
                snapMinutes(rawStartMinutes),
                endHour * 60 - duration,
            ),
        );

        const newEndMinutes = newStartMinutes + duration;

        return {
            dayIndex,
            top: getGridTopFromMinutes(newStartMinutes),
            height: (duration / 60) * SCHEDULE_LAYOUT.hourRowHeight,
            startTime: formatMinutesToInputTime(newStartMinutes),
            endTime: formatMinutesToInputTime(newEndMinutes),
        };
    };

    const getDefaultEditValues = (entry: ScheduleEntry): EditInitialValues => {
        const dayIndex = getDayIndexFromDate(parseIsoDate(entry.date));

        return {
            dayOfWeek: dayOfWeekByIndex[dayIndex] ?? 'MONDAY',
            startTime: entry.startTime,
            endTime: entry.endTime,
            instructorId: MOCK_DEFAULT_INSTRUCTOR_ID,
            roomId: MOCK_DEFAULT_ROOM_ID,
            applyOnce: false,
        };
    };

    const handleClosePopup = () => {
        detailsRequestId.current += 1;
        setSelectedEntry(null);
        setSelectedDetails(null);
    };

    const handleCloseEditPopup = () => {
        setEditEntry(null);
        setEditInitialValues(null);
    };

    const openEditPopup = (entry: ScheduleEntry, values?: Partial<EditInitialValues>) => {
        setEditEntry(entry);
        setEditInitialValues({
            ...getDefaultEditValues(entry),
            ...values,
            applyOnce: false,
        });

        handleClosePopup();
    };

    const handleTileClick = async (entry: ScheduleEntry) => {
        if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
        }

        // TODO: uncomment when backend endpoint is ready
        // const currentRequestId = detailsRequestId.current + 1;
        // detailsRequestId.current = currentRequestId;
        //
        // setSelectedEntry(null);
        // setSelectedDetails(null);
        //
        // const response = await fetchCourseSessionDetails(entry.id);
        //
        // if (detailsRequestId.current !== currentRequestId) {
        //     return;
        // }
        //
        // if (!response) {
        //     setSelectedEntry(null);
        //     setSelectedDetails(null);
        //     return;
        // }
        //
        // setSelectedEntry(entry);
        // setSelectedDetails(mapCourseSessionDetails(response));

        setSelectedEntry(entry);
        setSelectedDetails(getMockedCourseSessionDetails(entry));
    };

    const handleEditSave = async (payload: UpdateScheduleSessionRequest) => {
        if (!editEntry) {
            return;
        }

        setIsSavingEdit(true);

        try {
            await updateScheduleSession(editEntry.id, payload);

            handleCloseEditPopup();
            await onSessionUpdated?.();
        } catch (error) {
            if (error instanceof Error && error.message === 'Schedule update conflict') {
                window.alert(formatMessage({
                    id: 'schedule.edit.conflict',
                    defaultMessage: 'This change creates a conflict.',
                }));
                return;
            }

            window.alert(formatMessage({
                id: 'schedule.edit.error',
                defaultMessage: 'Failed to update schedule session.',
            }));
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleTilePointerDown = (
        entry: ScheduleEntry,
        event: ReactPointerEvent<HTMLDivElement>,
    ) => {
        if (event.button !== 0) {
            return;
        }

        const tileElement = event.currentTarget;
        const rect = tileElement.getBoundingClientRect();

        setDragPreview({
            entry,
            pointerX: event.clientX,
            pointerY: event.clientY,
            initialPointerX: event.clientX,
            initialPointerY: event.clientY,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            width: rect.width,
            height: rect.height,
            hasMoved: false,
        });

        setDropPreview(null);
    };

    const handleWindowPointerMove = (event: PointerEvent) => {
        setDragPreview((current) => {
            if (!current) {
                return null;
            }

            const distanceX = Math.abs(event.clientX - current.initialPointerX);
            const distanceY = Math.abs(event.clientY - current.initialPointerY);
            const hasMoved = current.hasMoved || distanceX > DRAG_START_THRESHOLD_PX || distanceY > DRAG_START_THRESHOLD_PX;

            if (!hasMoved) {
                return {
                    ...current,
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                    hasMoved,
                };
            }

            event.preventDefault();

            setDropPreview(getDropPreviewFromPointer(
                event.clientX,
                event.clientY,
                current,
            ));

            return {
                ...current,
                pointerX: event.clientX,
                pointerY: event.clientY,
                hasMoved,
            };
        });
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
        setDragPreview((currentDragPreview) => {
            if (!currentDragPreview) {
                setDropPreview(null);
                return null;
            }

            if (!currentDragPreview.hasMoved) {
                setDropPreview(null);
                return null;
            }

            suppressNextClickRef.current = true;

            const finalDropPreview = getDropPreviewFromPointer(
                event.clientX,
                event.clientY,
                currentDragPreview,
            );

            if (finalDropPreview) {
                openEditPopup(currentDragPreview.entry, {
                    dayOfWeek: dayOfWeekByIndex[finalDropPreview.dayIndex] ?? 'MONDAY',
                    startTime: finalDropPreview.startTime,
                    endTime: finalDropPreview.endTime,
                });
            }

            setDropPreview(null);
            return null;
        });
    };
    useEffect(() => {
        if (!dragPreview) {
            return;
        }

        window.addEventListener('pointermove', handleWindowPointerMove);
        window.addEventListener('pointerup', handleWindowPointerUp);
        window.addEventListener('pointercancel', handleWindowPointerUp);

        return () => {
            window.removeEventListener('pointermove', handleWindowPointerMove);
            window.removeEventListener('pointerup', handleWindowPointerUp);
            window.removeEventListener('pointercancel', handleWindowPointerUp);
        };
    }, [dragPreview]);

    useEffect(() => {
        handleClosePopup();
        handleCloseEditPopup();
        setDragPreview(null);
        setDropPreview(null);
    }, [entries]);

    return (
        <Box sx={{position: 'relative', px: 0, pb: 0}}>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: SCHEDULE_LAYOUT.dayHeaderHeight + gridHeight,
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: SCHEDULE_LAYOUT.sidebarWidth,
                        right: 0,
                        height: SCHEDULE_LAYOUT.dayHeaderHeight,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${SCHEDULE_LAYOUT.dayCount}, minmax(0, 1fr))`,
                    }}
                >
                    {weekdayMessageIds.map((dayId: string) => (
                        <Box
                            key={dayId}
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                pb: 0.5,
                                minWidth: 0,
                            }}
                        >
                            <Typography sx={{fontSize: '13px', color: '#2B2B2B', fontWeight: 500}}>
                                {formatMessage({id: dayId})}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Box
                    sx={{
                        position: 'absolute',
                        top: SCHEDULE_LAYOUT.dayHeaderHeight,
                        left: 0,
                        width: SCHEDULE_LAYOUT.sidebarWidth,
                        height: gridHeight,
                    }}
                >
                    {getTimeGridMarkers()
                        .filter((minutes) => minutes % 60 === 0)
                        .slice(0, -1)
                        .map((minutes) => (
                            <Box
                                key={minutes}
                                sx={{
                                    position: 'absolute',
                                    top: getGridTopFromMinutes(minutes) - 11,
                                    right: 10,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '13px',
                                        color: '#2B2B2B',
                                        fontWeight: 500,
                                    }}
                                >
                                    {formatMinutesToTimeLabel(minutes)}
                                </Typography>
                            </Box>
                        ))}                </Box>

                <Box
                    ref={gridRef}
                    sx={{
                        position: 'absolute',
                        top: SCHEDULE_LAYOUT.dayHeaderHeight,
                        left: SCHEDULE_LAYOUT.sidebarWidth,
                        right: 0,
                        height: gridHeight,
                    }}
                >
                    {Array.from({length: SCHEDULE_LAYOUT.dayCount + 1}).map((_, index) => (
                        <Box
                            key={`vertical-${index}`}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: `${(index / SCHEDULE_LAYOUT.dayCount) * 100}%`,
                                width: '1px',
                                height: gridHeight,
                                bgcolor: 'rgba(68, 68, 68, 0.33)',
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {getTimeGridMarkers().map((minutes) => {
                        const isFullHour = minutes % 60 === 0;

                        return (
                            <Box
                                key={`horizontal-${minutes}`}
                                sx={{
                                    position: 'absolute',
                                    top: getGridTopFromMinutes(minutes),
                                    left: 0,
                                    width: '100%',
                                    height: isFullHour ? '1px' : '1px',
                                    bgcolor: isFullHour
                                        ? 'rgba(68, 68, 68, 0.36)'
                                        : 'rgba(68, 68, 68, 0.07)',
                                    pointerEvents: 'none',
                                }}
                            />
                        );
                    })}

                    {dropPreview && dragPreview?.hasMoved && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: dropPreview.top,
                                left: `${(dropPreview.dayIndex / SCHEDULE_LAYOUT.dayCount) * 100}%`,
                                width: `${100 / SCHEDULE_LAYOUT.dayCount}%`,
                                height: dropPreview.height,
                                px: 0.5,
                                boxSizing: 'border-box',
                                pointerEvents: 'none',
                                zIndex: 12,
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '8px',
                                    bgcolor: 'rgba(79, 94, 130, 0.14)',
                                    border: '2px dashed rgba(79, 94, 130, 0.55)',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </Box>
                    )}

                    {orderedEntries.map((entry) => {
                        const layout = entryLayouts[entry.id] ?? {
                            columnIndex: 0,
                            columnCount: 1,
                        };

                        return (
                            <ScheduleTileFactory
                                key={entry.id}
                                entry={entry}
                                columnIndex={layout.columnIndex}
                                columnCount={layout.columnCount}
                                onClick={handleTileClick}
                                onPointerDown={handleTilePointerDown}
                                draggingEntryId={dragPreview?.hasMoved ? dragPreview.entry.id : null}
                            />
                        );
                    })}

                    {selectedEntry && selectedDetails && (
                        <Box
                            onClick={handleClosePopup}
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 19,
                            }}
                        >
                            <Box onClick={(event) => event.stopPropagation()}>
                                <SubjectDetailsPopup
                                    entry={selectedEntry}
                                    details={selectedDetails}
                                    onClose={handleClosePopup}
                                    onEdit={() => openEditPopup(selectedEntry)}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            <EditScheduleSessionPopup
                key={
                    editEntry && editInitialValues
                        ? [
                            editEntry.id,
                            editInitialValues.dayOfWeek,
                            editInitialValues.startTime,
                            editInitialValues.endTime,
                            editInitialValues.instructorId,
                            editInitialValues.roomId,
                        ].join('-')
                        : 'closed'
                }
                open={Boolean(editEntry)}
                entry={editEntry}
                initialValues={editInitialValues}
                instructors={mockedInstructors}
                rooms={mockedRooms}
                isSaving={isSavingEdit}
                onClose={handleCloseEditPopup}
                onSave={handleEditSave}
            />

            {dragPreview?.hasMoved && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: dragPreview.pointerY - dragPreview.offsetY,
                        left: dragPreview.pointerX - dragPreview.offsetX,
                        width: dragPreview.width,
                        height: dragPreview.height,
                        borderRadius: '8px',
                        bgcolor: 'rgba(255,255,255,0.92)',
                        border: '2px solid rgba(79, 94, 130, 0.45)',
                        boxShadow: '0 18px 40px rgba(20, 30, 55, 0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 1,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        transform: 'scale(1.02)',
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 'clamp(8px, 0.72vw, 11px)',
                            lineHeight: 1.15,
                            fontWeight: 600,
                            color: '#1E1E1E',
                            textAlign: 'center',
                            whiteSpace: 'pre-line',
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {dragPreview.entry.title}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}