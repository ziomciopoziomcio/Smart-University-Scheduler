import type {ScheduleEntry} from '@api/types.ts';
import {
    getDayIndexFromDate,
    parseIsoDate,
} from '../utils/dateUtils.ts';
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
}

export function ScheduleTileFactory({entry}: ScheduleTileFactoryProps) {
    const entryDate = parseIsoDate(entry.date);
    const dayIndex = getDayIndexFromDate(entryDate);

    const sharedProps = {
        title: entry.title,
        top: getTileTop(entry.startHour),
        leftPercent: getTileLeftPercent(dayIndex),
        widthPercent: getTileWidthPercent(),
        height: getTileHeight(entry.startHour, entry.endHour),
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