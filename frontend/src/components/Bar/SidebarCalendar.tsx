import {useState} from 'react';
import {Box, Typography, IconButton, MenuItem, Menu} from '@mui/material';
import {CalendarToday, ChevronLeft, ChevronRight, ArrowDropDown} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {theme} from "../../theme/theme.ts";

//TODO: USER CAN CHOOSE WEEK TO SEE PLAN
export default function SidebarCalendar({open}: { open: boolean }) {
    const intl = useIntl();
    const [viewDate, setViewDate] = useState(new Date());
    const today = new Date();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    if (!open) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', width: '100%'}}>
                <CalendarToday sx={{fontSize: 22, color: '#333'}}/>
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
        'calendar.sundayShort'
    ];

    const changeMonth = (step: number) => {
        setViewDate(new Date(year, month + step, 1));
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{
            background: 'white',
            p: 2,
            borderRadius: '24px',
            width: '100%',
            boxShadow: '0px 2px 12px rgba(0,0,0,0.06)'
        }}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5}}>

                <Box onClick={handleOpenMenu} sx={{display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 0.5}}>

                    <Typography sx={{
                        fontWeight: 500,
                        fontSize: theme.fontSizes.small,
                        textTransform: 'capitalize'
                    }}>
                        {intl.formatDate(viewDate, {month: 'long', year: 'numeric'})}
                    </Typography>

                    <ArrowDropDown fontSize="small"/>
                </Box>

                <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleCloseMenu}
                    slotProps={{
                        paper: {
                            sx: {
                                maxHeight: 250,
                                mt: 1,
                                boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
                                overflowY: 'auto',
                                msOverflowStyle: 'none',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': {
                                    display: 'none',
                                },
                            }
                        }
                    }}
                >
                    {Array.from({length: 12}).map((_, index) => {
                        const monthDate = new Date(academicStartYear, 9 + index, 1);

                        const isSelected = monthDate.getMonth() === month && monthDate.getFullYear() === year;

                        const isActualCurrentMonth =
                            monthDate.getMonth() === today.getMonth() &&
                            monthDate.getFullYear() === today.getFullYear();

                        return (
                            <MenuItem
                                key={index}
                                selected={isSelected}
                                onClick={() => {
                                    setViewDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
                                    handleCloseMenu();
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
                                            background: '#005a8d',
                                            borderRadius: '50%'
                                        }
                                    })
                                }}
                            >
                                {intl.formatDate(monthDate, {month: 'long', year: 'numeric'})}
                            </MenuItem>
                        );
                    })}
                </Menu>

                <Box sx={{display: 'flex', gap: 0.5}}>
                    <IconButton size="small"
                                onClick={() => {
                                    changeMonth(-1)
                                }}
                                disabled={month === 9}
                                sx={{
                                    p: 0.5,
                                    "&.Mui-disabled": {
                                        opacity: 0.3
                                    }
                                }}>
                        <ChevronLeft fontSize="small"/>
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => {
                            changeMonth(1);
                        }}
                        disabled={month === 8}
                        sx={{
                            p: 0.5,
                            "&.Mui-disabled": {opacity: 0.3}
                        }}
                    >
                        <ChevronRight fontSize="small"/>
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{display: 'flex', flexWrap: 'wrap'}}>
                {daysHeaderKeys.map((key) => (
                    <Box key={key} sx={{flex: '0 0 14.28%', textAlign: 'center', mb: 1}}>
                        <Typography sx={{fontSize: '11px', color: '#888', fontWeight: 700}}>
                            {intl.formatMessage({id: key, defaultMessage: 'Day'})}
                        </Typography>
                    </Box>
                ))}

                {Array.from({length: offset}).map((_, i) => (
                    <Box key={`prev-${i}`} sx={{flex: '0 0 14.28%', textAlign: 'center'}}>
                        <Typography sx={{fontSize: '12px', color: '#ccc', p: '6px 0'}}>
                            {daysInPrevMonth - offset + i + 1}
                        </Typography>
                    </Box>
                ))}

                {Array.from({length: daysInMonth}).map((_, i) => {
                    const dayNum = i + 1;
                    const isCurrentDay = dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    return (
                        <Box key={dayNum} sx={{
                            flex: '0 0 14.28%',
                            textAlign: 'center',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Typography sx={{
                                fontSize: '12px',
                                width: '28px',
                                height: '28px',
                                lineHeight: '28px',
                                fontWeight: isCurrentDay ? 800 : 500,
                                color: isCurrentDay ? '#005a8d' : '#333',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                '&:hover': {background: '#f0f4f8'},
                                position: 'relative',
                                ...(isCurrentDay && {
                                    background: 'rgba(0, 90, 141, 0.1)',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: '2px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '4px',
                                        height: '4px',
                                        background: '#005a8d',
                                        borderRadius: '50%'
                                    }
                                })
                            }}>
                                {dayNum}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}