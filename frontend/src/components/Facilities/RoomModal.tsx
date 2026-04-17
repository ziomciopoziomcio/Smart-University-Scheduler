import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, TextField, Box, Button,
    CircularProgress, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {useIntl} from 'react-intl';
import {createRoom, updateRoom, fetchFaculties, fetchUnits} from '@api/facilities';

export default function RoomModal({open, buildingId, room, onClose, onSuccess}: any) {
    const intl = useIntl();

    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState<number | ''>('');
    const [pcAmount, setPcAmount] = useState<number | ''>('');
    const [projector, setProjector] = useState(false);

    const [assignmentType, setAssignmentType] = useState<'faculty' | 'unit'>('faculty');
    const [selectedId, setSelectedId] = useState<number | ''>('');

    const [options, setOptions] = useState<any[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (room) {
                setName(room.room_name);
                setCapacity(room.room_capacity);
                setPcAmount(room.pc_amount);
                setProjector(room.projector_availability);
                if (room.unit_id) {
                    setAssignmentType('unit');
                    setSelectedId(room.unit_id);
                } else {
                    setAssignmentType('faculty');
                    setSelectedId(room.faculty_id);
                }
            } else {
                setName('');
                setCapacity(15);
                setPcAmount(0);
                setProjector(false);
                setAssignmentType('faculty');
                setSelectedId('');
            }
        }
    }, [open, room]);


    useEffect(() => {
        if (!open) return;
        const loadOptions = async () => {
            setIsLoadingOptions(true);
            try {
                const res = assignmentType === 'faculty' ? await fetchFaculties() : await fetchUnits();
                setOptions(res.items);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoadingOptions(false);
            }
        };
        loadOptions();
    }, [open, assignmentType]);

    const handleSubmit = async () => {
        if (!name || !selectedId) return;
        setIsSubmitting(true);

        let actualFacultyId = 0;
        if (assignmentType === 'faculty') {
            actualFacultyId = Number(selectedId);
        } else {
            const selectedUnitObj = options.find(opt => opt.id === selectedId);
            actualFacultyId = selectedUnitObj ? selectedUnitObj.faculty_id : room?.faculty_id;
        }

        const payload = {
            room_name: name,
            building_id: buildingId,
            faculty_id: actualFacultyId,
            unit_id: assignmentType === 'unit' ? Number(selectedId) : null,
            pc_amount: Number(pcAmount),
            room_capacity: Number(capacity),
            projector_availability: projector
        };

        try {
            if (room) {
                await updateRoom(room.id, payload)
            } else {
                await createRoom(payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            alert(intl.formatMessage({id: 'facilities.room.errors.add'}));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 420}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {room
                        ? intl.formatMessage({id: 'facilities.room.edit'})
                        : intl.formatMessage({id: 'facilities.room.add'})}
                </Typography>

                <TextField
                    label={intl.formatMessage({id: 'facilities.room.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'facilities.room.namePlaceholder'})}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {intl.formatMessage({id: 'facilities.room.assignment'})}
                    </Typography>
                    <ToggleButtonGroup
                        value={assignmentType}
                        exclusive
                        onChange={(_, val) => {
                            if (val) {
                                setAssignmentType(val);
                                setSelectedId('');
                            }
                        }}
                        fullWidth
                        size="small"
                        sx={{'& .MuiToggleButton-root': {borderRadius: '8px', textTransform: 'none'}}}
                    >
                        <ToggleButton
                            value="faculty">{intl.formatMessage({id: 'facilities.room.faculty'})}</ToggleButton>
                        <ToggleButton value="unit">{intl.formatMessage({id: 'facilities.room.unit'})}</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <FormControl fullWidth sx={{'& .MuiOutlinedInput-root': {borderRadius: '12px'}}}>
                    <InputLabel>
                        {assignmentType === 'faculty'
                            ? intl.formatMessage({id: 'facilities.room.selectFaculty'})
                            : intl.formatMessage({id: 'facilities.room.selectUnit'})}
                    </InputLabel>
                    <Select
                        value={selectedId}
                        label={assignmentType === 'faculty'
                            ? intl.formatMessage({id: 'facilities.room.selectFaculty'})
                            : intl.formatMessage({id: 'facilities.room.selectUnit'})}
                        onChange={(e) => setSelectedId(e.target.value as number)}
                        disabled={isLoadingOptions}
                    >
                        {options.map((opt) => (
                            <MenuItem key={opt.id} value={opt.id}>
                                {assignmentType === 'faculty' ? `${opt.faculty_name} (${opt.faculty_short})` : opt.unit_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField
                        type="number"
                        label={intl.formatMessage({id: 'facilities.room.capacityLabel'})}
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        fullWidth
                        InputProps={{sx: {borderRadius: '12px'}}}
                    />
                    <TextField
                        type="number"
                        label={intl.formatMessage({id: 'facilities.room.pcLabel'})}
                        value={pcAmount}
                        onChange={(e) => setPcAmount(Number(e.target.value))}
                        fullWidth
                        InputProps={{sx: {borderRadius: '12px'}}}
                    />
                </Box>

                <FormControlLabel
                    control={<Checkbox checked={projector} onChange={(e) => setProjector(e.target.checked)}/>}
                    label={intl.formatMessage({id: 'facilities.room.projectorLabel'})}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedId || !name}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24}
                                                          color="inherit"/> : intl.formatMessage({id: 'facilities.common.save'})}
                    </Button>
                    <Button
                        variant="text"
                        fullWidth
                        onClick={onClose}
                        disabled={isSubmitting}
                        sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}
                    >
                        {intl.formatMessage({id: 'facilities.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}