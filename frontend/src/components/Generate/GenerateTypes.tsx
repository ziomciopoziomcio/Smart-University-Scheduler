import type {DashboardTileType} from '../Common/Notification';

export enum ScheduleVersionIssue {
    Warning = 'WARNING',
    Critical = 'CRITICAL',
}

export interface ScheduleNotification {
    type: ScheduleVersionIssue;
    message: string;
}

export interface GenerateScheduleResponse {
    id: number;
    notifications: ScheduleNotification[];
}

export const getTileTypeFromNotificationType = (type: ScheduleVersionIssue): DashboardTileType => {
    switch (type) {
        case ScheduleVersionIssue.Critical:
            return 'error';
        case ScheduleVersionIssue.Warning:
            return 'warning';
        default:
            return 'info';
    }
};