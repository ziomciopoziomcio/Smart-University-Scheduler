export function getStartOfWeek(date: Date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() + diff);

    return result;
}

export function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function addWeeks(date: Date, weeks: number) {
    return addDays(date, weeks * 7);
}

export function parseIsoDate(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function isSameDate(left: Date, right: Date) {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

export function isDateInWeek(date: Date, weekStart: Date) {
    const weekEnd = addDays(weekStart, 6);

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return normalizedDate >= weekStart && normalizedDate <= weekEnd;
}

export function getDayIndexFromDate(date: Date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

export function formatWeekRange(startOfWeek: Date) {
    const endOfWeek = addDays(startOfWeek, 6);

    const startDay = String(startOfWeek.getDate()).padStart(2, '0');
    const startMonth = String(startOfWeek.getMonth() + 1).padStart(2, '0');

    const endDay = String(endOfWeek.getDate()).padStart(2, '0');
    const endMonth = String(endOfWeek.getMonth() + 1).padStart(2, '0');

    return `${startDay}.${startMonth} - ${endDay}.${endMonth}`;
}