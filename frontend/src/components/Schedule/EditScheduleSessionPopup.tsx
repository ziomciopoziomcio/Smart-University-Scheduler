import {useEffect, useMemo, useState} from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogContent,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    type SelectChangeEvent,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {useIntl} from 'react-intl';

import type {
    DayOfWeek,
    ScheduleEditInstructorOption,
    ScheduleEditRoomOption,
    ScheduleEntry,
    UpdateScheduleSessionRequest,
} from '@api';

interface EditScheduleSessionInitialValues {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    instructorId: number;
    roomId: number;
    applyOnce: boolean;
}

interface EditScheduleSessionPopupProps {
    open: boolean;
    entry: ScheduleEntry | null;
    initialValues: EditScheduleSessionInitialValues | null;
    instructors?: ScheduleEditInstructorOption[];
    rooms?: ScheduleEditRoomOption[];
    isSaving?: boolean;
    onClose: () => void;
    onSave: (payload: UpdateScheduleSessionRequest) => Promise<void>;
}

interface FormValues {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    instructorId: number;
    roomId: number;
}

const defaultInstructors: ScheduleEditInstructorOption[] = [
    {id: 42, name: 'dr Anna Kowalska'},
    {id: 43, name: 'prof. Jan Nowak'},
    {id: 44, name: 'mgr Piotr Zieliński'},
];

const defaultRooms: ScheduleEditRoomOption[] = [
    {id: 18, name: 'B-214', building: 'B', campus: 'Główny'},
    {id: 19, name: 'A-101', building: 'A', campus: 'Główny'},
    {id: 20, name: 'C-12', building: 'C', campus: 'Technologiczny'},
];

const dayOptions: { value: DayOfWeek; label: string }[] = [
    {value: 'MONDAY', label: 'Monday'},
    {value: 'TUESDAY', label: 'Tuesday'},
    {value: 'WEDNESDAY', label: 'Wednesday'},
    {value: 'THURSDAY', label: 'Thursday'},
    {value: 'FRIDAY', label: 'Friday'},
    {value: 'SATURDAY', label: 'Saturday'},
    {value: 'SUNDAY', label: 'Sunday'},
];

export function EditScheduleSessionPopup({
                                             open,
                                             entry,
                                             initialValues,
                                             instructors = defaultInstructors,
                                             rooms = defaultRooms,
                                             isSaving = false,
                                             onClose,
                                             onSave,
                                         }: EditScheduleSessionPopupProps) {
    const {formatMessage} = useIntl();

    const fallbackValues = useMemo<FormValues>(() => ({
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '09:30',
        instructorId: instructors[0]?.id ?? 0,
        roomId: rooms[0]?.id ?? 0,
    }), [instructors, rooms]);

    const valuesFromProps = useMemo<FormValues>(() => {
        if (!initialValues) {
            return fallbackValues;
        }

        return {
            dayOfWeek: initialValues.dayOfWeek,
            startTime: initialValues.startTime,
            endTime: initialValues.endTime,
            instructorId: initialValues.instructorId,
            roomId: initialValues.roomId,
        };
    }, [
        fallbackValues,
        initialValues?.dayOfWeek,
        initialValues?.startTime,
        initialValues?.endTime,
        initialValues?.instructorId,
        initialValues?.roomId,
    ]);

    const [formValues, setFormValues] = useState<FormValues>(valuesFromProps);

    useEffect(() => {
        if (!open) {
            return;
        }

        setFormValues(valuesFromProps);
    }, [open, valuesFromProps]);

    const handleSave = async () => {
        await onSave({
            dayOfWeek: formValues.dayOfWeek,
            startTime: formValues.startTime,
            endTime: formValues.endTime,
            instructorId: formValues.instructorId,
            roomId: formValues.roomId,
            applyOnce: false,
        });
    };

    const isSaveDisabled =
        !formValues.startTime ||
        !formValues.endTime ||
        formValues.startTime >= formValues.endTime ||
        !formValues.instructorId ||
        !formValues.roomId ||
        isSaving;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            keepMounted={false}
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    boxShadow: '0 24px 60px rgba(20, 30, 55, 0.18)',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogContent sx={{p: {xs: 3, md: 4}, bgcolor: '#FFFFFF'}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2.5, mb: 3}}>
                    <CalendarTodayIcon
                        sx={{
                            fontSize: 54,
                            color: '#A8ADB7',
                            flexShrink: 0,
                        }}
                    />

                    <Box sx={{textAlign: 'left'}}>
                        <Typography
                            sx={{
                                fontSize: {xs: 25, md: 30},
                                fontWeight: 700,
                                color: '#4F4F4F',
                                lineHeight: 1.1,
                            }}
                        >
                            {formatMessage({
                                id: 'schedule.edit.title',
                                defaultMessage: 'Edit schedule session',
                            })}
                        </Typography>

                        <Typography sx={{mt: 0.8, fontSize: 14.5, color: '#7A7A7A', lineHeight: 1.5}}>
                            {entry?.title ?? '—'}
                        </Typography>
                    </Box>
                </Box>

                <Stack spacing={2.2}>
                    <FormControl fullWidth>
                        <InputLabel>
                            {formatMessage({id: 'schedule.edit.dayOfWeek', defaultMessage: 'Day of week'})}
                        </InputLabel>
                        <Select
                            value={formValues.dayOfWeek}
                            label={formatMessage({id: 'schedule.edit.dayOfWeek', defaultMessage: 'Day of week'})}
                            onChange={(event: SelectChangeEvent) => {
                                setFormValues((current) => ({
                                    ...current,
                                    dayOfWeek: event.target.value as DayOfWeek,
                                }));
                            }}
                            sx={{borderRadius: '16px', bgcolor: '#FBFCFF'}}
                        >
                            {dayOptions.map((day) => (
                                <MenuItem key={day.value} value={day.value}>
                                    {day.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2}}>
                        <TextField
                            fullWidth
                            type="time"
                            label={formatMessage({id: 'schedule.edit.startTime', defaultMessage: 'Start time'})}
                            value={formValues.startTime}
                            onChange={(event) => {
                                setFormValues((current) => ({
                                    ...current,
                                    startTime: event.target.value,
                                }));
                            }}
                            InputLabelProps={{shrink: true}}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    bgcolor: '#FBFCFF',
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            type="time"
                            label={formatMessage({id: 'schedule.edit.endTime', defaultMessage: 'End time'})}
                            value={formValues.endTime}
                            onChange={(event) => {
                                setFormValues((current) => ({
                                    ...current,
                                    endTime: event.target.value,
                                }));
                            }}
                            InputLabelProps={{shrink: true}}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    bgcolor: '#FBFCFF',
                                },
                            }}
                        />
                    </Box>

                    <FormControl fullWidth>
                        <InputLabel>
                            {formatMessage({id: 'schedule.edit.instructor', defaultMessage: 'Instructor'})}
                        </InputLabel>
                        <Select
                            value={String(formValues.instructorId)}
                            label={formatMessage({id: 'schedule.edit.instructor', defaultMessage: 'Instructor'})}
                            onChange={(event: SelectChangeEvent) => {
                                setFormValues((current) => ({
                                    ...current,
                                    instructorId: Number(event.target.value),
                                }));
                            }}
                            sx={{borderRadius: '16px', bgcolor: '#FBFCFF'}}
                        >
                            {instructors.map((instructor) => (
                                <MenuItem key={instructor.id} value={String(instructor.id)}>
                                    {instructor.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>
                            {formatMessage({id: 'schedule.edit.room', defaultMessage: 'Room'})}
                        </InputLabel>
                        <Select
                            value={String(formValues.roomId)}
                            label={formatMessage({id: 'schedule.edit.room', defaultMessage: 'Room'})}
                            onChange={(event: SelectChangeEvent) => {
                                setFormValues((current) => ({
                                    ...current,
                                    roomId: Number(event.target.value),
                                }));
                            }}
                            sx={{borderRadius: '16px', bgcolor: '#FBFCFF'}}
                        >
                            {rooms.map((room) => (
                                <MenuItem key={room.id} value={String(room.id)}>
                                    {[
                                        room.name,
                                        room.building ? `Building ${room.building}` : undefined,
                                        room.campus,
                                    ].filter(Boolean).join(' · ')}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControlLabel
                        control={<Checkbox checked={false} disabled/>}
                        label={formatMessage({
                            id: 'schedule.edit.applyOnce',
                            defaultMessage: 'Apply only once',
                        })}
                        sx={{
                            color: '#7A7A7A',
                            '& .MuiFormControlLabel-label': {
                                fontSize: 14,
                            },
                        }}
                    />

                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1}}>
                        <Button
                            onClick={onClose}
                            disabled={isSaving}
                            sx={{
                                height: 48,
                                px: 3,
                                borderRadius: '15px',
                                textTransform: 'none',
                                color: '#5F6B7A',
                                fontWeight: 700,
                            }}
                        >
                            {formatMessage({id: 'common.cancel', defaultMessage: 'Cancel'})}
                        </Button>

                        <Button
                            variant="contained"
                            onClick={() => void handleSave()}
                            disabled={isSaveDisabled}
                            sx={{
                                height: 48,
                                px: 3.5,
                                borderRadius: '15px',
                                textTransform: 'none',
                                bgcolor: '#4F5E82',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                boxShadow: '0 12px 24px rgba(79, 94, 130, 0.24)',
                                '&:hover': {
                                    bgcolor: '#465577',
                                    boxShadow: '0 14px 28px rgba(79, 94, 130, 0.30)',
                                },
                            }}
                        >
                            {isSaving
                                ? formatMessage({id: 'common.saving', defaultMessage: 'Saving...'})
                                : formatMessage({id: 'common.save', defaultMessage: 'Save'})}
                        </Button>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}