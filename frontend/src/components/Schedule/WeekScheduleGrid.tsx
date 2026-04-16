import {Box, Typography} from '@mui/material';
import {useMemo, useState, useEffect} from 'react';
import type {ScheduleEntry, ScheduleEntryDetails} from '@api/types';
import {SCHEDULE_LAYOUT, scheduleHours, weekdayMessageIds} from '@constants/schedule';
import {ScheduleTileFactory} from './Tile/ScheduleTileFactory';
import {SubjectDetailsPopup} from './SubjectDetailsPopup';
import {formatMinutesToTimeLabel, getGridHeight, parseTimeToMinutes} from './utils/utils';
import {scheduleDetailsMock} from '../../mocks/scheduleDetailsMock';
import {useIntl} from 'react-intl';
import {getDayIndexFromDate, parseIsoDate} from './utils/dateUtils';

interface WeekScheduleGridProps {
    entries: ScheduleEntry[];
}

interface EntryLayout {
    columnIndex: number;
    columnCount: number;
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
    const {formatMessage} = useIntl();
    const gridHeight = getGridHeight();

    const orderedEntries = useMemo(() => {
        return [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [entries]);

    const entryLayouts = useMemo(() => {
        return getEntryLayouts(orderedEntries);
    }, [orderedEntries]);

    useEffect(() => {
        setSelectedEntry(null);
        setSelectedDetails(null);
    }, [entries]);

    const halfHourLines = useMemo(() => {
        const result: number[] = [];

        for (let i = 0; i < scheduleHours.length - 1; i += 1) {
            const hour = scheduleHours[i];
            result.push(hour * 60);
            result.push(hour * 60 + 30);
        }

        result.push(scheduleHours[scheduleHours.length - 1] * 60);

        return result;
    }, []);

    const handleTileClick = (entry: ScheduleEntry) => {
        setSelectedEntry(entry);
        const details = scheduleDetailsMock[entry.id] ?? null;
        setSelectedDetails(details);
    };

    const handleClosePopup = () => {
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

                    {halfHourLines.map((minutes, index) => {
                        const top =
                            ((minutes - scheduleHours[0] * 60) / 60) * SCHEDULE_LAYOUT.hourRowHeight;

                        const isFullHour = minutes % 60 === 0;

                        return (
                            <Box
                                key={`horizontal-${minutes}-${index}`}
                                sx={{
                                    position: 'absolute',
                                    top,
                                    left: 0,
                                    width: '100%',
                                    height: '1px',
                                    bgcolor: isFullHour
                                        ? 'rgba(68, 68, 68, 0.33)'
                                        : 'rgba(68, 68, 68, 0.16)',
                                    borderTop: isFullHour ? 'none' : '1px dashed rgba(68, 68, 68, 0.10)',
                                }}
                            />
                        );
                    })}

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
                            <SubjectDetailsPopup
                                entry={selectedEntry}
                                details={selectedDetails}
                                onClose={handleClosePopup}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}