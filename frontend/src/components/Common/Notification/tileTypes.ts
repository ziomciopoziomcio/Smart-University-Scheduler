import type {ElementType, ReactNode} from 'react';
import type {SxProps, Theme} from '@mui/material';

export type DashboardTileVariant = 'success' | 'warning' | 'error' | 'info';

export interface DashboardTileStyle {
    bg: string;
    iconColor: string;
    Icon: ElementType;
}

export interface DashboardTileCardProps {
    title: ReactNode;
    description?: ReactNode;
    variant?: DashboardTileVariant;
    icon?: ElementType;
    backgroundColor?: string;
    iconColor?: string;
    children?: ReactNode;
    onClick?: () => void;
    sx?: SxProps<Theme>;
}