import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, TextField, Box, Button, CircularProgress} from '@mui/material';
import {useIntl} from 'react-intl';
import {createCampus, updateCampus, type Campus} from '@api';

interface CampusModalProps {
    open: boolean;
    campus?: Campus | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CampusModal({open, campus, onClose, onSuccess}: CampusModalProps) {
    const intl = useIntl();
    const [name, setName] = useState('');
    const [short, setShort] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditMode = Boolean(campus);

    useEffect(() => {
        setName(campus?.campus_name || '');
        setShort(campus?.campus_short || '');
    }, [campus, open]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {campus_name: name, campus_short: short};
            if (isEditMode && campus) {
                await updateCampus(campus.id, payload);
            } else {
                await createCampus(payload);
            }
            onSuccess();
            onClose();
        } catch {
            alert(intl.formatMessage({id: 'facilities.campus.error.add'}));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', minWidth: 400, p: 1}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {isEditMode
                        ? intl.formatMessage({id: 'facilities.campus.edit'})
                        : intl.formatMessage({id: 'facilities.campus.add'})}
                </Typography>

                <TextField
                    label={intl.formatMessage({id: 'facilities.campus.shortLabel'})}
                    placeholder={intl.formatMessage({id: 'facilities.campus.shortPlaceholder'})}
                    value={short}
                    onChange={(e) => {
                        setShort(e.target.value);
                    }} fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />
                <TextField
                    label={intl.formatMessage({id: 'facilities.campus.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'facilities.campus.namePlaceholder'})}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        onClick={() => {
                            void handleSubmit();
                        }} disabled={loading || !short}
                        sx={{
                            bgcolor: '#2b5073',
                            borderRadius: '12px',
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {loading ? <CircularProgress size={24}
                                                     color="inherit"/> : intl.formatMessage({id: 'facilities.common.save'})}
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