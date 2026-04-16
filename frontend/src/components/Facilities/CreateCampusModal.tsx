// TODO: repalce deprecated funcs
import {useState} from 'react';
import {Dialog, DialogContent, Typography, TextField, Box, Button, CircularProgress} from '@mui/material';
import {createCampus} from '@api/facilities';

interface CreateCampusModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateCampusModal({open, onClose, onSuccess}: CreateCampusModalProps) {
    const [shortName, setShortName] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!shortName) return;

        setIsSubmitting(true);
        try {
            await createCampus({
                campus_short: shortName,
                campus_name: fullName || undefined
            });

            setShortName('');
            setFullName('');

            onSuccess();

            onClose();
        } catch (err) {
            alert("Błąd podczas dodawania kampusu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setShortName('');
            setFullName('');
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 400}}}
        >
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3, mt: 2}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    Dodaj kampus
                </Typography>

                <TextField
                    label="Identyfikator kampusu"
                    placeholder='Wpisz identyfikator kampusu (np. "A")'
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <TextField
                    label="Nazwa kampusu"
                    placeholder='Wpisz nazwę kampusu (opcjonalnie, np. "Główny")'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={isSubmitting || !shortName}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': {bgcolor: '#1a3a56'}
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : 'Dodaj kampus'}
                    </Button>

                    <Button
                        variant="text"
                        fullWidth
                        onClick={handleClose}
                        disabled={isSubmitting}
                        sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}
                    >
                        Anuluj
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}