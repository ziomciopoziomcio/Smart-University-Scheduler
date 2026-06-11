import {create} from 'zustand';
import {
    addWeeks,
    getStartOfWeek,
} from '@components/Schedule/utils/dateUtils';

interface CalendarWeekState {
    currentWeekStart: Date;
    setCurrentWeekStart: (date: Date) => void;
    goToPreviousWeek: () => void;
    goToNextWeek: () => void;
}

export const useCalendarWeekStore = create<CalendarWeekState>((set) => ({
    currentWeekStart: getStartOfWeek(new Date()),

    setCurrentWeekStart: (date) => {
        set({
            currentWeekStart: getStartOfWeek(date),
        });
    },

    goToPreviousWeek: () => {
        set((state) => ({
            currentWeekStart: addWeeks(state.currentWeekStart, -1),
        }));
    },

    goToNextWeek: () => {
        set((state) => ({
            currentWeekStart: addWeeks(state.currentWeekStart, 1),
        }));
    },
}));