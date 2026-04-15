// TODO: validation, error handling, loading state
// TODO: visual improvements
import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, TextField, Box, Button, CircularProgress} from '@mui/material';
import {useIntl} from 'react-intl';
import {updateCampus} from '@api/facilities';

interface EditCampusModalProps {
    open: boolean;
    campus: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditCampusModal({open, campus, onClose, onSuccess}: EditCampusModalProps) {
    const intl = useIntl();
    const [shortName, setShortName] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (campus) {
            setShortName(campus.campus_short || '');
            setFullName(campus.campus_name || '');
        }
    }, [campus]);

    const handleSubmit = async () => {
        if (!shortName || !campus) return;

        setIsSubmitting(true);
        try {
            await updateCampus(campus.id, {
                campus_short: shortName,
                campus_name: fullName || undefined
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert(intl.formatMessage({id: 'facilities.modal.campus.error'}));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 400}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3, mt: 2}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    {intl.formatMessage({id: 'facilities.modal.campus.campusEdit.title'})}
                </Typography>

                <TextField
                    label={intl.formatMessage({id: 'facilities.modal.campus.shortNameLabel'})}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <TextField
                    label={intl.formatMessage({id: 'facilities.modal.campus.nameLabel'})}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained" fullWidth onClick={handleSubmit} disabled={isSubmitting || !shortName}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': {bgcolor: '#1a3a56'}
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24}
                                                          color="inherit"/> : intl.formatMessage({id: 'facilities.modal.campus.campusEdit.submit'})}
                    </Button>
                    <Button variant="text" fullWidth onClick={onClose} disabled={isSubmitting}
                            sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}>
                        {intl.formatMessage({id: 'facilities.deleteConfirm.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}