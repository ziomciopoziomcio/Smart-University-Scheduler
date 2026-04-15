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
                                     horizontalGap = 8,
                                 }: BaseScheduleTileProps) {
    return (
        <Box
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
                px: 1,
                boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
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
                    fontSize: height >= 120 ? '100px' : '90px',
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
                    fontSize: 'clamp(9px, 0.72vw, 11px)',
                    lineHeight: 1.2,
                    fontWeight: 500,
                    color: '#1E1E1E',
                    maxWidth: '100%',
                }}
            >
                {title}
            </Typography>
        </Box>
    );
}