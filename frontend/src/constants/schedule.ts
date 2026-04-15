export const SCHEDULE_LAYOUT = {
    sidebarWidth: 48,
    headerHeight: 74,
    dayHeaderHeight: 28,
    hourRowHeight: 43,
    startHour: 8,
    endHour: 20,
    dayCount: 7,
    tileHorizontalGap: 8,
} as const;

export const scheduleHours = Array.from(
    {length: SCHEDULE_LAYOUT.endHour - SCHEDULE_LAYOUT.startHour + 1},
    (_, index) => SCHEDULE_LAYOUT.startHour + index,
);

export const weekdayMessageIds = [
    'calendar.mondayShort',
    'calendar.tuesdayShort',
    'calendar.wednesdayShort',
    'calendar.thursdayShort',
    'calendar.fridayShort',
    'calendar.saturdayShort',
    'calendar.sundayShort',
] as const;

export const tilePalette = {
    lecture: {
        background: '#86E0E4',
        border: '#72D6DB',
        watermark: 'rgba(82, 198, 205, 0.16)',
    },
    lab: {
        background: '#F2D0A1',
        border: '#E7BE83',
        watermark: 'rgba(211, 153, 62, 0.16)',
    },
    exercise: {
        background: '#B8B5FF',
        border: '#A3A0F0',
        watermark: 'rgba(98, 90, 210, 0.14)',
    },
    project: {
        background: '#7CCB80',
        border: '#66BA6B',
        watermark: 'rgba(62, 143, 68, 0.15)',
    },
    seminar: {
        background: '#B6E8EB',
        border: '#9ADDE1',
        watermark: 'rgba(82, 198, 205, 0.16)',
    },
} as const;