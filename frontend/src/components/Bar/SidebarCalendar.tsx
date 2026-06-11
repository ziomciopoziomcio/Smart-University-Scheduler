import {useEffect, useMemo, useState} from 'react';
import {Box, Typography, IconButton, MenuItem, Menu} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {
    CalendarToday,
    ChevronLeft,
    ChevronRight,
    ArrowDropDown,
} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {getStartOfWeek} from '@components/Schedule/utils/dateUtils';
import {useCalendarWeekStore} from '@store/useCalendarWeekStore';

interface SidebarCalendarProps {
    open: boolean;
}

const isSameDay = (left: Date, right: Date) => {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
};

const isSameMonth = (left: Date, right: Date) => {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth()
    );
};

export default function SidebarCalendar({open}: SidebarCalendarProps) {
    const intl = useIntl();
    const theme = useTheme();

    const currentWeekStart = useCalendarWeekStore(
        (state) => state.currentWeekStart,
    );

    const setCurrentWeekStart = useCalendarWeekStore(
        (state) => state.setCurrentWeekStart,
    );

    const [viewDate, setViewDate] = useState(
        () => new Date(
            currentWeekStart.getFullYear(),
            currentWeekStart.getMonth(),
            1,
        ),
    );

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const today = useMemo(() => new Date(), []);
    const menuOpen = Boolean(anchorEl);

    useEffect(() => {
        setViewDate(
            new Date(
                currentWeekStart.getFullYear(),
                currentWeekStart.getMonth(),
                1,
            ),
        );
    }, [currentWeekStart]);

    if (!open) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                <CalendarToday
                    sx={{
                        fontSize: 22,
                        color: theme.palette.text.secondary,
                    }}
                />
            </Box>
        );
    }

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const academicStartYear = month < 9 ? year - 1 : year;

    const daysHeaderKeys = [
        'calendar.mondayShort',
        'calendar.tuesdayShort',
        'calendar.wednesdayShort',
        'calendar.thursdayShort',
        'calendar.fridayShort',
        'calendar.saturdayShort',
        'calendar.sundayShort',
    ];

    const changeMonth = (step: number) => {
        setViewDate(new Date(year, month + step, 1));
    };

    const handleDayClick = (date: Date) => {
        setCurrentWeekStart(getStartOfWeek(date));
    };

    const isDateInSelectedWeek = (date: Date) => {
        return isSameDay(getStartOfWeek(date), currentWeekStart);
    };

    return (
        <Box
            sx={{
                background: theme.palette.background.paper,
                p: 2,
                borderRadius: '24px',
                width: '100%',
                boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                    : '0 2px 12px rgba(0, 0, 0, 0.06)'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                }}
            >
                <Box
                    onClick={(event) => {
                        setAnchorEl(event.currentTarget);
                    }}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        gap: 0.5,
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: theme.fontSizes.small,
                            textTransform: 'capitalize',
                            color: theme.palette.text.primary
                        }}
                    >
                        {intl.formatDate(viewDate, {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </Typography>

                    <ArrowDropDown fontSize="small" sx={{color: theme.palette.text.secondary}}/>
                </Box>

                <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={() => {
                        setAnchorEl(null);
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                maxHeight: 250,
                                mt: 1,
                                boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
                                    : '0px 4px 20px rgba(0,0,0,0.1)',
                                overflowY: 'auto',
                                msOverflowStyle: 'none',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': {
                                    display: 'none',
                                },
                            },
                        },
                    }}
                >
                    {Array.from({length: 12}).map((_, index) => {
                        const monthDate = new Date(academicStartYear, 9 + index, 1);
                        const isSelected = isSameMonth(monthDate, viewDate);
                        const isActualCurrentMonth = isSameMonth(monthDate, today);

                        return (
                            <MenuItem
                                key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                                selected={isSelected}
                                onClick={() => {
                                    setViewDate(monthDate);
                                    setAnchorEl(null);
                                }}
                                sx={{
                                    textTransform: 'capitalize',
                                    fontSize: theme.fontSizes.tiny,
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    py: 1.25,
                                    ...(isActualCurrentMonth && {
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: '4px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '4px',
                                            height: '4px',
                                            background: theme.palette.primary.main,
                                            borderRadius: '50%'
                                        }
                                    })
                                }}
                            >
                                {intl.formatDate(monthDate, {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </MenuItem>
                        );
                    })}
                </Menu>

                <Box sx={{display: 'flex', gap: 0.5}}>
                    <IconButton
                        size="small"
                        onClick={() => {
                            changeMonth(-1);
                        }}
                        disabled={month === 9}
                        sx={{
                            p: 0.5,
                            color: theme.palette.primary.main,
                            "&.Mui-disabled": {
                                opacity: 0.3
                            }
                        }}
                    >
                        <ChevronLeft fontSize="small" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={() => {
                            changeMonth(1);
                        }}
                        disabled={month === 8}
                        sx={{
                            p: 0.5,
                            color: theme.palette.primary.main,
                            "&.Mui-disabled": {
                                opacity: 0.3
                            }
                        }}
                    >
                        <ChevronRight fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                }}
            >
                {daysHeaderKeys.map((key) => (
                    <Box
                        key={key}
                        sx={{
                            flex: '0 0 14.28%',
                            textAlign: 'center',
                            mb: 1,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '11px',
                                color: theme.palette.text.disabled,
                                fontWeight: 700,
                            }}
                        >
                            {intl.formatMessage({
                                id: key,
                                defaultMessage: 'Day',
                            })}
                        </Typography>
                    </Box>
                ))}

                {Array.from({length: offset}).map((_, index) => (
                    <Box
                        key={`prev-${index}`}
                        sx={{
                            flex: '0 0 14.28%',
                            textAlign: 'center',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '12px',
                                color: theme.palette.text.disabled,
                                opacity: 0.5,
                                p: '6px 0',
                            }}
                        >
                            {daysInPrevMonth - offset + index + 1}
                        </Typography>
                    </Box>
                ))}

                {Array.from({length: daysInMonth}).map((_, index) => {
                    const dayNumber = index + 1;
                    const date = new Date(year, month, dayNumber);
                    const isCurrentDay = isSameDay(date, today);
                    const isSelectedWeek = isDateInSelectedWeek(date);

                    return (
                        <Box
                            key={dayNumber}
                            sx={{
                                flex: '0 0 14.28%',
                                textAlign: 'center',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Typography
                                onClick={() => {
                                    handleDayClick(date);
                                }}
                                sx={{
                                    fontSize: '12px',
                                    width: '28px',
                                    height: '28px',
                                    lineHeight: '28px',
                                    fontWeight: isCurrentDay ? 800 : 500,
                                    color: isCurrentDay ? theme.palette.primary.main : theme.palette.text.primary,
                                    cursor: 'pointer',
                                    borderRadius: '50%',
                                    position: 'relative',
                                    background: isSelectedWeek ? theme.palette.background.selected : 'transparent',
                                    '&:hover': {
                                        background: theme.palette.background.highlight,
                                    },
                                    ...(isCurrentDay && {
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: '2px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '4px',
                                            height: '4px',
                                            background: theme.palette.primary.main,
                                            borderRadius: '50%',
                                        },
                                    }),
                                }}
                            >
                                {dayNumber}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
