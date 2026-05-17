import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Button, Box,
    TextField, Alert, CircularProgress, MenuItem
} from '@mui/material';
import {useIntl} from 'react-intl';
import {type StudyField, createStudyField, updateStudyField} from '@api';
import type {StudyDegree, StudyMode} from '@api/domains/courses/types';

interface StudyFieldModalProps {
    open: boolean;
    studyField: StudyField | null;
    facultyId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const DEGREES: StudyDegree[] = ['Bachelor', 'Master', 'Uniform_Master', 'Doctoral'];
const MODES: StudyMode[] = ['Full-time', 'Part-time'];

export function StudyFieldModal({open, studyField, facultyId, onClose, onSuccess}: StudyFieldModalProps) {
    const intl = useIntl();
    const isEdit = Boolean(studyField);
    const [name, setName] = useState('');
    const [degree, setDegree] = useState<StudyDegree>('Bachelor');
    const [mode, setMode] = useState<StudyMode>('Full-time');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(studyField?.field_name || '');
            setDegree(studyField?.degree || 'Bachelor');
            setMode(studyField?.mode || 'Full-time');
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
            const payload = {
                field_name: name.trim(),
                faculty: facultyId,
                degree,
                mode
            };

            if (isEdit && studyField) {
                await updateStudyField(studyField.id, payload);
            } else {
                await createStudyField(payload as any);
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : intl.formatMessage({id: 'didactics.common.errorSave'});
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 450}}}>
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

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField
                        select
                        fullWidth
                        label={intl.formatMessage({id: 'didactics.fields.degreeLabel', defaultMessage: 'Stopień'})}
                        value={degree}
                        onChange={(e) => setDegree(e.target.value as StudyDegree)}
                        InputProps={{sx: {borderRadius: '12px'}}}
                    >
                        {DEGREES.map(d => (
                            <MenuItem key={d} value={d}>
                                {intl.formatMessage({id: `didactics.fields.degrees.${d}`})}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label={intl.formatMessage({id: 'didactics.fields.modeLabel', defaultMessage: 'Tryb'})}
                        value={mode}
                        onChange={(e) => setMode(e.target.value as StudyMode)}
                        InputProps={{sx: {borderRadius: '12px'}}}
                    >
                        {MODES.map(m => (
                            <MenuItem key={m} value={m}>
                                {intl.formatMessage({id: `didactics.fields.modes.${m}`})}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

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