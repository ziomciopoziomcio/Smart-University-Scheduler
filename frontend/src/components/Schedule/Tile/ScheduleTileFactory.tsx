import type {PointerEvent} from 'react';
import {type ScheduleEntry} from '@api';
import {
    getDayIndexFromDate,
    parseIsoDate,
} from '../utils/dateUtils';
import {
    getTileHeight,
    getTileTop,
} from '../utils/utils.ts';
import {SCHEDULE_LAYOUT} from '@constants/schedule';
import {ExerciseTile} from './ExerciseTile.tsx';
import {LabTile} from './LabTile.tsx';
import {LectureTile} from './LectureTile.tsx';
import {ProjectTile} from './ProjectTile.tsx';
import {SeminarTile} from './SeminarTile.tsx';

interface ScheduleTileFactoryProps {
    entry: ScheduleEntry;
    columnIndex?: number;
    columnCount?: number;
    onClick: (entry: ScheduleEntry) => void;
    onPointerDown?: (entry: ScheduleEntry, event: PointerEvent<HTMLDivElement>) => void;
    draggingEntryId?: string | null;
}

export function ScheduleTileFactory({
    entry,
    columnIndex = 0,
    columnCount = 1,
    onClick,
    onPointerDown,
    draggingEntryId,
}: ScheduleTileFactoryProps) {
    const entryDate = parseIsoDate(entry.date);
    const dayIndex = getDayIndexFromDate(entryDate);

    const dayWidthPercent = 100 / SCHEDULE_LAYOUT.dayCount;
    const safeColumnCount = Math.max(columnCount, 1);
    const singleTileWidthPercent = dayWidthPercent / safeColumnCount;

    const sharedProps = {
        title: entry.title,
        top: getTileTop(entry.startTime),
        leftPercent: dayIndex * dayWidthPercent + columnIndex * singleTileWidthPercent,
        widthPercent: singleTileWidthPercent,
        height: getTileHeight(entry.startTime, entry.endTime),
        onClick: () => onClick(entry),
        onPointerDown: (event: PointerEvent<HTMLDivElement>) => onPointerDown?.(entry, event),
        isDragging: draggingEntryId === entry.id,
    };

    switch (entry.variant) {
        case 'lab':
            return <LabTile {...sharedProps} />;
        case 'exercise':
            return <ExerciseTile {...sharedProps} />;
        case 'project':
            return <ProjectTile {...sharedProps} />;
        case 'seminar':
            return <SeminarTile {...sharedProps} />;
        case 'lecture':
        default:
            return <LectureTile {...sharedProps} />;
    }
}