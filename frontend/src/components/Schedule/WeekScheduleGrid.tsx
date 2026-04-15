import {Box, Typography} from '@mui/material';
import type {ScheduleEntry} from '@api/types';
import {SCHEDULE_LAYOUT, scheduleHours, weekdayMessageIds} from '@constants/schedule';
import {ScheduleTileFactory} from './Tile/ScheduleTileFactory.tsx';
import {getGridHeight} from './utils/utils.ts';
import {useIntl} from "react-intl";
import {useMemo, useState} from 'react';
import {SubjectDetailsPopup} from "@components/Schedule/SubjectDetailsPopup.tsx";

interface WeekScheduleGridProps {
    entries: ScheduleEntry[];
}

export function WeekScheduleGrid({entries}: WeekScheduleGridProps) {
    const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
    const gridHeight = getGridHeight();
    const {formatMessage} = useIntl();

    const orderedEntries = useMemo(() => {
        return [...entries].sort((a, b) => a.startHour - b.startHour);
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
                                {hour}
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

                    {orderedEntries.map((entry) => (
                        <ScheduleTileFactory
                            key={entry.id}
                            entry={entry}
                            onClick={setSelectedEntry}
                        />
                    ))}

                    {selectedEntry && (
                        <SubjectDetailsPopup
                            entry={selectedEntry}
                            onClose={() => setSelectedEntry(null)}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
}