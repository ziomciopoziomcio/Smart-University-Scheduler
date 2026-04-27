import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Button, Box,
    TextField, Alert, CircularProgress
} from '@mui/material';
import {useIntl} from 'react-intl';
import {type StudyField, createStudyField, updateStudyField} from '@api';

interface StudyFieldModalProps {
    open: boolean;
    studyField: StudyField | null;
    facultyId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function StudyFieldModal({open, studyField, facultyId, onClose, onSuccess}: StudyFieldModalProps) {
    const intl = useIntl();
    const isEdit = Boolean(studyField);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(studyField?.field_name || '');
            setError(null);
        }
    }, [open, studyField]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError(intl.formatMessage({id: 'didactics.common.errorRequired'}));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isEdit && studyField) {
                await updateStudyField(studyField.id, {field_name: name.trim()});
            } else {
                await createStudyField({
                    field_name: name.trim(),
                    faculty: facultyId
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || intl.formatMessage({id: 'didactics.common.errorSave'}));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 400}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3, mt: 2}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    {intl.formatMessage({id: isEdit ? 'didactics.fields.edit' : 'didactics.fields.add'})}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label={intl.formatMessage({id: 'didactics.fields.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'didactics.fields.namePlaceholder'})}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={loading || !name.trim()}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            background: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': {bgcolor: '#1a3a56'}
                        }}
                    >
                        {loading ?
                            <CircularProgress size={24} color="inherit"/> :
                            intl.formatMessage({id: isEdit ? 'didactics.common.saveChanges' : 'didactics.fields.add'})
                        }
                    </Button>
                    <Button
                        variant="text"
                        fullWidth
                        onClick={onClose}
                        disabled={loading}
                        sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}
                    >
                        {intl.formatMessage({id: 'didactics.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}