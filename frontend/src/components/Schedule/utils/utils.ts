import { SCHEDULE_LAYOUT } from '@constants/schedule';

export const getTileTop = (startHour: number) =>
  (startHour - SCHEDULE_LAYOUT.startHour) * SCHEDULE_LAYOUT.hourRowHeight;

export const getTileHeight = (startHour: number, endHour: number) =>
  (endHour - startHour) * SCHEDULE_LAYOUT.hourRowHeight;

export const getTileLeftPercent = (day: number) =>
  (day / SCHEDULE_LAYOUT.dayCount) * 100;

export const getTileWidthPercent = () =>
  100 / SCHEDULE_LAYOUT.dayCount;

export const getGridHeight = () =>
  (SCHEDULE_LAYOUT.endHour - SCHEDULE_LAYOUT.startHour) *
  SCHEDULE_LAYOUT.hourRowHeight;