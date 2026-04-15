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
        background: '#FFDEB2',
        border: '#F0BC77',
        watermark: 'rgba(240, 188, 119, 0.27)',
    },
    lab: {
        background: '#93F4F8',
        border: '#68C8CC',
        watermark: 'rgba(104, 200, 204, 0.27)',
    },
    exercise: {
        background: '#C2C1FF',
        border: '#8481FC',
        watermark: 'rgba(132, 129, 252, 0.27)',
    },
    project: {
        background: '#76CB7F',
        border: '#3D7D44',
        watermark: 'rgba(61, 125, 68, 0.27)',
    },
    seminar: {
        background: '#B6E8EB',
        border: '#9ADDE1',
        watermark: 'rgba(82, 198, 205, 0.16)',
    },
} as const;