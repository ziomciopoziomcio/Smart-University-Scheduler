/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import {Box, Typography, Divider, Button, IconButton, SvgIcon} from '@mui/material';
import {Add, MoreVert} from '@mui/icons-material';
import * as React from 'react';

export interface ListColumn<T> {
    render: (item: T) => React.ReactNode | string;
    variant?: 'primary' | 'secondary';
    width?: string | number;
    icon?: React.ElementType;
    align?: 'left' | 'center' | 'right';
}

interface ListViewProps<T> {
    items: T[];
    icon?: React.ElementType;
    getTitle: (item: T) => string | React.ReactNode;
    titleWidth?: string | number;
    columns?: ListColumn<T>[];
    onItemClick?: (item: T) => void;
    onMenuOpen?: (e: React.MouseEvent<HTMLElement>, item: T) => void;
    onAddClick?: () => void;
    addLabel?: string;
    emptyMessage?: string;
    hideDividerOnLastItem?: boolean;
    rowSx?: object;
    titleSx?: object;
}

export default function ListView<T extends { id: number | string }>({
                                                                        items,
                                                                        icon: Icon,
                                                                        getTitle,
                                                                        titleWidth,
                                                                        columns = [],
                                                                        onItemClick,
                                                                        onMenuOpen,
                                                                        onAddClick,
                                                                        addLabel,
                                                                        emptyMessage,
                                                                        hideDividerOnLastItem = true,
                                                                        rowSx = {},
                                                                        titleSx = {},
                                                                    }: ListViewProps<T>) {
    return (
        <Box sx={{width: '100%'}}>
            {items.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    {emptyMessage}
                </Typography>
            )}

            {items.map((item, index) => (
                <Box key={item.id}>
                    <Box
                        onClick={() => {
                            if (onItemClick) onItemClick(item);
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 2.25,
                            px: {xs: 1.5, md: 3},
                            cursor: onItemClick ? 'pointer' : 'default',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                                bgcolor: onItemClick ? '#F3F5F8' : 'transparent',
                            },
                            ...rowSx,
                        }}
                    >
                        {Icon && (
                            <Box sx={{mr: 2, display: 'flex', alignItems: 'center', flexShrink: 0}}>
                                <SvgIcon
                                    component={Icon}
                                    inheritViewBox
                                    sx={{fontSize: 28, color: 'text.secondary', opacity: 0.6}}
                                />
                            </Box>
                        )}

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: {xs: 2, md: 4},
                                width: '100%',
                                minWidth: 0,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Typography
                                sx={{
                                    width: titleWidth ?? 220,
                                    minWidth: 160,
                                    fontSize: '18px',
                                    fontWeight: 400,
                                    color: '#111111',
                                    lineHeight: 1.2,
                                    ...titleSx,
                                }}
                            >
                                {getTitle(item)}
                            </Typography>

                            {columns.map((col, colIndex) => (
                                <Box
                                    key={colIndex}
                                    sx={{
                                        width: col.width ?? 'auto',
                                        minWidth: typeof col.width === 'number' ? col.width : undefined,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent:
                                            col.align === 'right'
                                                ? 'flex-end'
                                                : col.align === 'center'
                                                    ? 'center'
                                                    : 'flex-start',
                                        gap: 1,
                                    }}
                                >
                                    {col.icon && (
                                        <SvgIcon
                                            component={col.icon}
                                            inheritViewBox
                                            sx={{
                                                fontSize: 18,
                                                color:
                                                    col.variant === 'primary'
                                                        ? 'text.primary'
                                                        : 'text.secondary',
                                                opacity: 0.7,
                                            }}
                                        />
                                    )}

                                    <Typography
                                        variant="body2"
                                        color={
                                            col.variant === 'primary'
                                                ? 'text.primary'
                                                : 'text.secondary'
                                        }
                                        sx={{
                                            fontSize: '15px',
                                            color: col.variant === 'primary' ? '#111111' : '#8A8A8A',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {col.render(item)}
                                    </Typography>
                                </Box>
                            ))}

                            {onMenuOpen && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMenuOpen(e, item);
                                    }}
                                    sx={{ml: 'auto'}}
                                >
                                    <MoreVert sx={{color: '#aaa'}}/>
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    {(!hideDividerOnLastItem || index < items.length - 1) && <Divider/>}
                </Box>
            ))}

            {onAddClick && addLabel && (
                <Button
                    startIcon={<Add/>}
                    onClick={onAddClick}
                    sx={{
                        mt: 2,
                        color: 'text.secondary',
                        textTransform: 'none',
                        fontWeight: 500,
                    }}
                >
                    {addLabel}
                </Button>
            )}
        </Box>
    );
}