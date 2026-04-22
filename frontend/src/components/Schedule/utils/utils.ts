import {SCHEDULE_LAYOUT, scheduleHours} from '@constants/schedule';

export function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function formatMinutesToTimeLabel(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getGridHeight(): number {
    return (scheduleHours.length - 1) * SCHEDULE_LAYOUT.hourRowHeight;
}

export function getTileTop(startTime: string): number {
    const startMinutes = parseTimeToMinutes(startTime);
    const firstHourMinutes = scheduleHours[0] * 60;
    const minutesFromTop = startMinutes - firstHourMinutes;

    return (minutesFromTop / 60) * SCHEDULE_LAYOUT.hourRowHeight;
}

export function getTileHeight(startTime: string, endTime: string): number {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;

    return (durationMinutes / 60) * SCHEDULE_LAYOUT.hourRowHeight;
}

export function getTileLeftPercent(dayIndex: number): number {
    return (dayIndex / SCHEDULE_LAYOUT.dayCount) * 100;
}

export function getTileWidthPercent(): number {
    return 100 / SCHEDULE_LAYOUT.dayCount;
}