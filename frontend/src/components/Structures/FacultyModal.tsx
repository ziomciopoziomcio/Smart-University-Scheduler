import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, TextField, Button, CircularProgress, Box} from '@mui/material';
import {createFaculty, updateFaculty} from '@api/structures';
import {useIntl} from "react-intl";
import type {Faculty} from '@api/types';

interface FacultyModalProps {
    open: boolean;
    faculty: Faculty | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FacultyModal({open, faculty, onClose, onSuccess}: FacultyModalProps) {

    const intl = useIntl();
    const [name, setName] = useState('');
    const [short, setShort] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(faculty?.faculty_name || '');
        setShort(faculty?.faculty_short || '');
    }, [faculty, open]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (faculty) {
                await updateFaculty(faculty.id, {faculty_name: name, faculty_short: short});
            } else {
                await createFaculty({faculty_name: name, faculty_short: short});
            }
            onSuccess();
            onClose();
        } catch {
            alert(intl.formatMessage({id: 'structures.faculty.errors.add'}));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', minWidth: 400}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold">
                    {faculty ?
                        intl.formatMessage({id: 'structures.faculty.edit'}) :
                        intl.formatMessage({id: 'structures.faculty.add'})}
                </Typography>
                <TextField
                    label={intl.formatMessage({id: 'structures.faculty.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'structures.faculty.namePlaceholder'})}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    fullWidth
                />
                <TextField
                    label={intl.formatMessage({id: 'structures.faculty.shortLabel'})}
                    placeholder={intl.formatMessage({id: 'structures.faculty.shortPlaceholder'})}
                    value={short}
                    onChange={(e) => {
                        setShort(e.target.value);
                    }}
                    fullWidth
                />
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button variant="contained"
                            onClick={() => {
                                handleSubmit();
                            }}
                            disabled={loading || !name || !short}
                            sx={{
                                background: '#2b5073',
                                borderRadius: '12px',
                                py: 1.5
                            }}
                    >
                        {loading ?
                            <CircularProgress size={24} color="inherit"/> :
                            intl.formatMessage({id: 'structures.common.save'})}
                    </Button>
                    <Button
                        variant="text"
                        onClick={onClose}
                        disabled={loading}
                        sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}
                    >
                        {intl.formatMessage({id: 'facilities.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}