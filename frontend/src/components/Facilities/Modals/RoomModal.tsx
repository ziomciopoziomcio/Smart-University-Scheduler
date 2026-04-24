import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, TextField, Box, Button,
    CircularProgress, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox
} from '@mui/material';
import {useIntl} from 'react-intl';
import {createRoom, updateRoom, fetchFaculties, fetchUnits, type Room} from '@api';

interface RoomModalProps {
    open: boolean;
    buildingId: number;
    room: Room | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function RoomModal({open, buildingId, room, onClose, onSuccess}: RoomModalProps) {
    const intl = useIntl();

    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState<number | ''>('');
    const [pcAmount, setPcAmount] = useState<number | ''>('');
    const [projector, setProjector] = useState(false);

    const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');
    const [selectedUnitId, setSelectedUnitId] = useState<number | ''>('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [faculties, setFaculties] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [units, setUnits] = useState<any[]>([]);

    const [isLoadingFaculties, setIsLoadingFaculties] = useState(false);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (room) {
                setName(room.room_name);
                setCapacity(room.room_capacity);
                setPcAmount(room.pc_amount);
                setProjector(room.projector_availability);
                setSelectedFacultyId(room.faculty_id);
                setSelectedUnitId(room.unit_id || '');
            } else {
                setName('');
                setCapacity(15);
                setPcAmount(0);
                setProjector(false);
                setSelectedFacultyId('');
                setSelectedUnitId('');
            }
        }
    }, [open, room]);

    useEffect(() => {
        if (!open) return;
        const loadFaculties = async () => {
            setIsLoadingFaculties(true);
            try {
                const res = await fetchFaculties();
                setFaculties(res.items);
            } catch {
                console.error("Failed to load faculties");
            } finally {
                setIsLoadingFaculties(false);
            }
        };
        void loadFaculties();
    }, [open]);

    useEffect(() => {
        if (!open || !selectedFacultyId) {
            setUnits([]);
            return;
        }

        const loadUnits = async () => {
            setIsLoadingUnits(true);
            try {
                const res = await fetchUnits(Number(selectedFacultyId));
                setUnits(res.items);
            } catch {
                console.error("Failed to load units");
            } finally {
                setIsLoadingUnits(false);
            }
        };
        void loadUnits();
    }, [open, selectedFacultyId]);

    const handleSubmit = async () => {
        if (!name || !selectedFacultyId) return;

        setIsSubmitting(true);

        const payload = {
            room_name: name,
            building_id: buildingId,
            faculty_id: Number(selectedFacultyId),
            unit_id: selectedUnitId ? Number(selectedUnitId) : null,
            pc_amount: Number(pcAmount),
            room_capacity: Number(capacity),
            projector_availability: projector
        };

        try {
            if (room) {
                await updateRoom(room.id, payload);
            } else {
                await createRoom(payload);
            }
            onSuccess();
            onClose();
        } catch {
            alert(intl.formatMessage({id: 'facilities.room.errors.add', defaultMessage: 'Błąd podczas zapisywania'}));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 420}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {room
                        ? intl.formatMessage({id: 'facilities.room.edit', defaultMessage: 'Edytuj salę'})
                        : intl.formatMessage({id: 'facilities.room.add', defaultMessage: 'Dodaj salę'})}
                </Typography>

                <TextField
                    label={intl.formatMessage({id: 'facilities.room.nameLabel', defaultMessage: 'Nazwa Sali'})}
                    placeholder={intl.formatMessage({
                        id: 'facilities.room.namePlaceholder',
                        defaultMessage: 'np. 1.05'
                    })}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <FormControl fullWidth sx={{'& .MuiOutlinedInput-root': {borderRadius: '12px'}}}>
                    <InputLabel>{intl.formatMessage({
                        id: 'facilities.room.selectFaculty',
                        defaultMessage: 'Wybierz Wydział'
                    })}</InputLabel>
                    <Select
                        value={selectedFacultyId}
                        label={intl.formatMessage({
                            id: 'facilities.room.selectFaculty',
                            defaultMessage: 'Wybierz Wydział'
                        })}
                        onChange={(e) => {
                            setSelectedFacultyId(e.target.value as number);
                            setSelectedUnitId('');
                        }}
                        disabled={isLoadingFaculties}
                    >
                        {faculties.map((opt) => (
                            <MenuItem key={opt.id} value={opt.id}>
                                {`${opt.faculty_name} (${opt.faculty_short})`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{'& .MuiOutlinedInput-root': {borderRadius: '12px'}}}
                             disabled={!selectedFacultyId || isLoadingUnits}>
                    <InputLabel>{intl.formatMessage({
                        id: 'facilities.room.selectUnit',
                        defaultMessage: 'Wybierz Jednostkę (Opcjonalne)'
                    })}</InputLabel>
                    <Select
                        value={selectedUnitId}
                        label={intl.formatMessage({
                            id: 'facilities.room.selectUnit',
                            defaultMessage: 'Wybierz Jednostkę (Opcjonalne)'
                        })}
                        onChange={(e) => {
                            setSelectedUnitId(e.target.value as number);
                        }}
                    >
                        <MenuItem value=""><em>Brak (Cały wydział)</em></MenuItem>
                        {units.map((opt) => (
                            <MenuItem key={opt.id} value={opt.id}>
                                {opt.unit_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField
                        type="number"
                        label={intl.formatMessage({id: 'facilities.room.capacityLabel', defaultMessage: 'Pojemność'})}
                        value={capacity}
                        onChange={(e) => {
                            setCapacity(Number(e.target.value));
                        }}
                        fullWidth
                        InputProps={{sx: {borderRadius: '12px'}}}
                    />
                    <TextField
                        type="number"
                        label={intl.formatMessage({id: 'facilities.room.pcLabel', defaultMessage: 'Ilość PC'})}
                        value={pcAmount}
                        onChange={(e) => {
                            setPcAmount(Number(e.target.value));
                        }}
                        fullWidth
                        InputProps={{sx: {borderRadius: '12px'}}}
                    />
                </Box>

                <FormControlLabel
                    control={<Checkbox checked={projector} onChange={(e) => setProjector(e.target.checked)}/>}
                    label={intl.formatMessage({id: 'facilities.room.projectorLabel', defaultMessage: 'Projektor'})}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting || !selectedFacultyId || !name}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : intl.formatMessage({
                            id: 'facilities.common.save',
                            defaultMessage: 'Zapisz'
                        })}
                    </Button>
                    <Button
                        variant="text"
                        fullWidth
                        onClick={onClose}
                        disabled={isSubmitting}
                        sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}
                    >
                        {intl.formatMessage({id: 'facilities.common.cancel', defaultMessage: 'Anuluj'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}