import type {PointerEvent} from 'react';
import {Box, Typography} from '@mui/material';

interface BaseScheduleTileProps {
    title: string;
    top: number;
    leftPercent: number;
    widthPercent: number;
    height: number;
    background: string;
    border: string;
    watermarkColor: string;
    watermarkText?: string;
    horizontalGap?: number;
    onClick?: () => void;
    onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
    isDragging?: boolean;
}

export function BaseScheduleTile({
    title,
    top,
    leftPercent,
    widthPercent,
    height,
    background,
    border,
    watermarkColor,
    watermarkText = 'W',
    horizontalGap = 4,
    onClick,
    onPointerDown,
    isDragging = false,
}: BaseScheduleTileProps) {
    return (
        <Box
            onClick={onClick}
            onPointerDown={onPointerDown}
            sx={{
                position: 'absolute',
                top,
                left: `calc(${leftPercent}% + ${horizontalGap / 2}px)`,
                width: `calc(${widthPercent}% - ${horizontalGap}px)`,
                height,
                borderRadius: '6px',
                bgcolor: background,
                border: `2px solid ${border}`,
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                px: 0.75,
                boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
                cursor: 'grab',
                opacity: isDragging ? 0.35 : 1,
                userSelect: 'none',
                touchAction: 'none',
                transition: isDragging
                    ? 'opacity 0.12s ease'
                    : 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                '&:active': {
                    cursor: 'grabbing',
                },
                '&:hover': {
                    transform: isDragging ? 'none' : 'scale(1.01)',
                    boxShadow: isDragging ? 'none' : '0 4px 10px rgba(0,0,0,0.08)',
                },
            }}
        >
            <Typography
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: height >= 120 ? '100px' : '80px',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: watermarkColor,
                    userSelect: 'none',
                    pointerEvents: 'none',
                }}
            >
                {watermarkText}
            </Typography>

            <Typography
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    whiteSpace: 'pre-line',
                    fontSize: 'clamp(8px, 0.72vw, 11px)',
                    lineHeight: 1.15,
                    fontWeight: 500,
                    color: '#1E1E1E',
                    maxWidth: '100%',
                    overflowWrap: 'anywhere',
                    pointerEvents: 'none',
                }}
            >
                {title}
            </Typography>
        </Box>
    );
}