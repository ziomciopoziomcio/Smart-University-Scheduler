import {Box, Typography} from '@mui/material';
import {useMemo, useRef, useState} from 'react';
import {useIntl} from 'react-intl';

import {SCHEDULE_LAYOUT, scheduleHours, weekdayMessageIds} from '@constants/schedule';
import {ScheduleTileFactory} from './Tile/ScheduleTileFactory';
import {SubjectDetailsPopup} from './SubjectDetailsPopup';
import {formatMinutesToTimeLabel, getGridHeight, parseTimeToMinutes} from './utils/utils';
import {getDayIndexFromDate, parseIsoDate} from './utils/dateUtils';

import type {
    CourseSessionDetailsResponse,
    ScheduleEntry,
    ScheduleEntryDetails
} from '@api';
import {fetchCourseSessionDetails} from '@api';

interface WeekScheduleGridProps {
    entries: ScheduleEntry[];
}

interface EntryLayout {
    columnIndex: number;
    columnCount: number;
}

const DETAILS_FETCH_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    return new Promise((resolve) => {
        const timeoutId = window.setTimeout(() => {
            resolve(null);
        }, timeoutMs);

        promise
            .then((value) => {
                resolve(value);
            })
            .catch(() => {
                resolve(null);
            })
            .finally(() => {
                window.clearTimeout(timeoutId);
            });
    });
}

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
            const startDiff =
                parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);

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

export function WeekScheduleGrid({entries}: WeekScheduleGridProps) {
    const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<ScheduleEntryDetails | null>(null);

    const detailsRequestId = useRef(0);

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

    const getSubjectTypeLabel = (type: string) => {
        switch (type) {
            case 'lecture':
                return formatMessage({id: 'schedule.subjectType.lecture'});

            case 'laboratory':
                return formatMessage({id: 'schedule.subjectType.lab'});

            case 'tutorials':
                return formatMessage({id: 'schedule.subjectType.exercise'});

            case 'seminar':
                return formatMessage({id: 'schedule.subjectType.seminar'});

            case 'other':
                return formatMessage({id: 'schedule.subjectType.other', defaultMessage: 'Other'});

            case 'e-learning':
                return formatMessage({id: 'schedule.subjectType.elearning', defaultMessage: 'E-learning'});

            default:
                return type || '—';
        }
    };

    const mapAudience = (targetAudience: string[]) => {
        return targetAudience.map((item) => {
            const parts = item.split(' | ');

            if (parts.length === 2) {
                return {
                    fieldOfStudy: parts[0] || item,
                    semester: '',
                    specialization: parts[1] || '',
                };
            }

            const [fieldOfStudy, semester, specialization] = parts;

            return {
                fieldOfStudy: fieldOfStudy || item,
                semester: semester || '',
                specialization: specialization || '',
            };
        });
    };

    const mapCourseSessionDetails = (
        details: CourseSessionDetailsResponse,
    ): ScheduleEntryDetails => {
        const targetAudience = details.targetAudience ?? details.target_audience ?? [];

        return {
            typeLabel: getSubjectTypeLabel(details.type),
            timeLabel: details.time,
            location: {
                campus: details.location.campus,
                building: details.location.building,
                room: details.location.room,
            },
            lecturer: details.lecturer,
            audience: mapAudience(targetAudience),
        };
    };

    const handleTileClick = async (entry: ScheduleEntry) => {
        const currentRequestId = detailsRequestId.current + 1;
        detailsRequestId.current = currentRequestId;

        setSelectedEntry(null);
        setSelectedDetails(null);

        const response = await withTimeout(
            fetchCourseSessionDetails(entry.id),
            DETAILS_FETCH_TIMEOUT_MS
        );

        if (detailsRequestId.current !== currentRequestId) {
            return;
        }

        if (!response) {
            setSelectedEntry(null);
            setSelectedDetails(null);
            return;
        }

        setSelectedEntry(entry);
        setSelectedDetails(mapCourseSessionDetails(response));
    };

    const handleClosePopup = () => {
        detailsRequestId.current += 1;
        setSelectedEntry(null);
        setSelectedDetails(null);
    };

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
                    {scheduleHours.slice(0, -1).map((hour: number, index: number) => (
                        <Box
                            key={hour}
                            sx={{
                                position: 'absolute',
                                top: index * SCHEDULE_LAYOUT.hourRowHeight - 11,
                                right: 10,
                            }}
                        >
                            <Typography sx={{fontSize: '13px', color: '#2B2B2B', fontWeight: 400}}>
                                {formatMinutesToTimeLabel(hour * 60)}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Box
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
                            }}
                        />
                    ))}

                    {scheduleHours.map((hour: number, index: number) => (
                        <Box
                            key={`horizontal-${hour}`}
                            sx={{
                                position: 'absolute',
                                top: index * SCHEDULE_LAYOUT.hourRowHeight,
                                left: 0,
                                width: '100%',
                                height: '1px',
                                bgcolor: 'rgba(68, 68, 68, 0.33)',
                            }}
                        />
                    ))}

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
                            <Box onClick={(e) => e.stopPropagation()}>
                                <SubjectDetailsPopup
                                    entry={selectedEntry}
                                    details={selectedDetails}
                                    onClose={handleClosePopup}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}