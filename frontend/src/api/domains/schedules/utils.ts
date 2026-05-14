import type {
    ScheduleEntry,
    SchedulePlanApiEntry,
    ScheduleTileVariant,
} from './types';

type QueryParamValue = string | number | null | undefined;

const DEFAULT_SCHEDULE_VARIANT: ScheduleTileVariant = 'lecture';

const SCHEDULE_VARIANT_MAP: Record<string, ScheduleTileVariant> = {
    lecture: 'lecture',
    laboratory: 'lab',
    tutorials: 'exercise',
    seminar: 'seminar',
    project: 'project',
};

export const createQueryParams = (
    params: Record<string, QueryParamValue>,
): URLSearchParams => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value != null) {
            query.set(key, String(value));
        }
    });

    return query;
};

export const mapScheduleVariant = (
    variant?: string | null,
): ScheduleTileVariant => {
    const normalizedVariant = variant?.toLowerCase();

    if (!normalizedVariant) {
        return DEFAULT_SCHEDULE_VARIANT;
    }

    return SCHEDULE_VARIANT_MAP[normalizedVariant] ?? DEFAULT_SCHEDULE_VARIANT;
};

export const mapScheduleEntry = (
    entry: SchedulePlanApiEntry,
): ScheduleEntry => ({
    id: entry.id,
    title: entry.title,
    date: entry.date,
    startTime: entry.startTime ?? entry.start_time ?? '',
    endTime: entry.endTime ?? entry.end_time ?? '',
    variant: mapScheduleVariant(entry.variant),
});

export const mapScheduleEntries = (
    entries: SchedulePlanApiEntry[],
): ScheduleEntry[] => entries.map(mapScheduleEntry);