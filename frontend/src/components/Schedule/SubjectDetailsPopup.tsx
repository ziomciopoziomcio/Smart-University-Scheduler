import CloseRounded from '@mui/icons-material/CloseRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {Box, Button, IconButton, Paper, Typography} from '@mui/material';
import type {ScheduleEntry, ScheduleEntryDetails} from '@api';
import {getTilePaletteByVariant} from './utils/tileColorUtils';
import {useIntl} from 'react-intl';

interface SubjectDetailsPopupProps {
    entry: ScheduleEntry;
    details: ScheduleEntryDetails;
    onClose: () => void;
    onEdit?: () => void;
}

export function SubjectDetailsPopup({
                                        entry,
                                        details,
                                        onClose,
                                        onEdit,
                                    }: SubjectDetailsPopupProps) {
    const palette = getTilePaletteByVariant(entry.variant);
    const {formatMessage} = useIntl();

    return (
        <Paper
            elevation={0}
            sx={{
                position: 'absolute',
                top: 30,
                left: '50%',
                transform: 'translateX(-20%)',
                width: 345,
                minHeight: 360,
                bgcolor: '#F8F8F8',
                borderRadius: '8px',
                border: `3px solid ${palette.border}`,
                boxSizing: 'border-box',
                zIndex: 20,
                p: 3,
                pt: onEdit ? 5.5 : 3,
            }}
        >
            {onEdit && (
                <Button
                    size="small"
                    startIcon={<EditOutlinedIcon sx={{fontSize: 15}}/>}
                    onClick={onEdit}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        left: 12,
                        minWidth: 'auto',
                        height: 28,
                        px: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#5F6B7A',
                        bgcolor: 'rgba(255,255,255,0.65)',
                        boxShadow: 'none',
                        '& .MuiButton-startIcon': {
                            mr: 0.5,
                        },
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.95)',
                            boxShadow: 'none',
                        },
                    }}
                >
                    {formatMessage({id: 'schedule.details.edit', defaultMessage: 'Edit'})}
                </Button>
            )}

            <IconButton
                onClick={onClose}
                size="small"
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                }}
                aria-label={formatMessage({id: 'schedule.details.close'})}
            >
                <CloseRounded fontSize="small"/>
            </IconButton>

            <Box sx={{pr: 3}}>
                <Typography
                    sx={{
                        fontSize: '23px',
                        lineHeight: 1.15,
                        fontWeight: 500,
                        color: '#111111',
                        whiteSpace: 'pre-line',
                        mb: 0.5,
                    }}
                >
                    {entry.title}
                </Typography>

                <Typography
                    sx={{
                        fontSize: '16px',
                        color: '#8A8A8A',
                        fontWeight: 500,
                        mb: 2.5,
                    }}
                >
                    {details.typeLabel}
                </Typography>
            </Box>

            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2.25}}>
                <Box>
                    <Typography sx={{fontSize: '15px', fontWeight: 600, mb: 0.5}}>
                        {formatMessage({id: 'schedule.details.time'})}
                    </Typography>
                    <Typography sx={{fontSize: '13px'}}>
                        {details.timeLabel}
                    </Typography>
                </Box>

                <Box>
                    <Typography sx={{fontSize: '15px', fontWeight: 600, mb: 0.5}}>
                        {formatMessage({id: 'schedule.details.location'})}
                    </Typography>
                    <Typography sx={{fontSize: '13px'}}>
                        {details.location.campus}
                    </Typography>
                    <Typography sx={{fontSize: '13px'}}>
                        {details.location.building}
                    </Typography>
                    <Typography sx={{fontSize: '13px'}}>
                        {details.location.room}
                    </Typography>
                </Box>

                <Box>
                    <Typography sx={{fontSize: '15px', fontWeight: 600, mb: 0.5}}>
                        {formatMessage({id: 'schedule.details.lecturer'})}
                    </Typography>
                    <Typography sx={{fontSize: '13px'}}>
                        {details.lecturer}
                    </Typography>
                </Box>

                {details.audience.length > 0 && (
                    <Box>
                        <Typography sx={{fontSize: '15px', fontWeight: 600, mb: 0.5}}>
                            {formatMessage({id: 'schedule.details.audience'})}
                        </Typography>

                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.75}}>
                            {details.audience.map((audience, index) => (
                                <Typography key={`${audience.fieldOfStudy}-${index}`} sx={{fontSize: '13px'}}>
                                    {[audience.fieldOfStudy, audience.semester, audience.specialization]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}