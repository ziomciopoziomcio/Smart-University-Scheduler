import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, TextField, Box, Button,
    CircularProgress, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { useIntl } from 'react-intl';
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

        if (open) {
            loadOptions();
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
            }
        }
    }, [open, assignmentType, room]);

    const handleSubmit = async () => {
        if (!name || !selectedId) return;
        setIsSubmitting(true);

        const payload = {
            room_name: name,
            building_id: buildingId,
            faculty_id: assignmentType === 'faculty' ? Number(selectedId) : 0,
            unit_id: assignmentType === 'unit' ? Number(selectedId) : null,
            pc_amount: Number(pcAmount),
            room_capacity: Number(capacity),
            projector_availability: projector
        };

        try {
            room ? await updateRoom(room.id, payload) : await createRoom(payload);
            onSuccess();
            onClose();
        } catch (err) {
            alert('Błąd zapisu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 420}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {room ? 'Edytuj salę' : 'Dodaj salę'}
                </Typography>

                <TextField label="Nazwa sali" value={name} onChange={(e) => setName(e.target.value)} fullWidth/>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PRZYPISANIE SALI DO:
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
                    >
                        <ToggleButton value="faculty" sx={{textTransform: 'none'}}>Wydziału</ToggleButton>
                        <ToggleButton value="unit" sx={{textTransform: 'none'}}>Jednostki</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <FormControl fullWidth>
                    <InputLabel>{assignmentType === 'faculty' ? 'Wybierz wydział' : 'Wybierz jednostkę'}</InputLabel>
                    <Select
                        value={selectedId}
                        label={assignmentType === 'faculty' ? 'Wybierz wydział' : 'Wybierz jednostkę'}
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
                    <TextField type="number" label="Miejsca" value={capacity}
                               onChange={(e) => setCapacity(Number(e.target.value))} fullWidth/>
                    <TextField type="number" label="Komputery" value={pcAmount}
                               onChange={(e) => setPcAmount(Number(e.target.value))} fullWidth/>
                </Box>

                <FormControlLabel
                    control={<Checkbox checked={projector} onChange={(e) => setProjector(e.target.checked)}/>}
                    label="Projektor dostępny"
                />

                <Button variant="contained" fullWidth onClick={handleSubmit} disabled={isSubmitting || !selectedId}
                        sx={{py: 1.5, borderRadius: '12px', bgcolor: '#2b5073'}}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit"/> : 'Zapisz'}
                </Button>
                <Button variant="text" fullWidth onClick={onClose} disabled={isSubmitting}
                        sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}>
                    {intl.formatMessage({id: 'facilities.deleteConfirm.cancel'})}
                </Button>

            </DialogContent>
        </Dialog>
    );
}