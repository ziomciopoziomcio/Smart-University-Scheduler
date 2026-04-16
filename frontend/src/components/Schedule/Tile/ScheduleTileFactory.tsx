import type {ScheduleEntry} from '@api/types.ts';
import {
    getDayIndexFromDate,
    parseIsoDate,
} from '../utils/dateUtils';
import {
    getTileHeight,
    getTileLeftPercent,
    getTileTop,
    getTileWidthPercent,
} from '../utils/utils.ts';
import {ExerciseTile} from './ExerciseTile.tsx';
import {LabTile} from './LabTile.tsx';
import {LectureTile} from './LectureTile.tsx';
import {ProjectTile} from './ProjectTile.tsx';
import {SeminarTile} from './SeminarTile.tsx';

interface ScheduleTileFactoryProps {
    entry: ScheduleEntry;
    onClick: (entry: ScheduleEntry) => void;
}

export function ScheduleTileFactory({
                                        entry,
                                        onClick,
                                    }: ScheduleTileFactoryProps) {
    const entryDate = parseIsoDate(entry.date);
    const dayIndex = getDayIndexFromDate(entryDate);

    const sharedProps = {
        title: entry.title,
        top: getTileTop(entry.startHour),
        leftPercent: getTileLeftPercent(dayIndex),
        widthPercent: getTileWidthPercent(),
        height: getTileHeight(entry.startHour, entry.endHour),
        onClick: () => onClick(entry),
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