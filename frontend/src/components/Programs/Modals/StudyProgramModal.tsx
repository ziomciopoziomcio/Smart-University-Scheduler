import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, DialogTitle, DialogActions,
    Button, TextField, CircularProgress, Typography, Box, Alert
} from '@mui/material';
import {useIntl} from 'react-intl';
import {type StudyProgram, createStudyProgram, updateStudyProgram} from '@api';

interface StudyProgramModalProps {
    open: boolean;
    program: StudyProgram | null;
    fieldId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function StudyProgramModal({open, program, fieldId, onClose, onSuccess}: StudyProgramModalProps) {
    const intl = useIntl();
    const isEditMode = Boolean(program);

    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [programName, setProgramName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setError(null);
            if (program && program.start_year.includes('/')) {
                const [from, to] = program.start_year.split('/');
                setYearFrom(from);
                setYearTo(to);
                setProgramName(program.program_name || '');
            } else {
                setYearFrom('');
                setYearTo('');
                setProgramName('');
            }
        }
    }, [open, program]);

    const validateYears = () => {
        const y1 = parseInt(yearFrom);
        const y2 = parseInt(yearTo);

        if (!/^\d{4}$/.test(yearFrom) || !/^\d{4}$/.test(yearTo)) {
            return intl.formatMessage({id: 'programs.modal.yearErrorFormat'});
        }
        if (y1 >= y2) {
            return intl.formatMessage({id: 'programs.modal.yearErrorOrder'});
        }
        if (y2 - y1 !== 1) {
            return intl.formatMessage({id: 'programs.modal.yearErrorDiff'});
        }
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateYears();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                study_field: fieldId,
                start_year: `${yearFrom}/${yearTo}`,
                program_name: programName || null
            };

            if (isEditMode && program) {
                await updateStudyProgram(program.id, payload);
            } else {
                await createStudyProgram(payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{sx: {borderRadius: '16px'}}}>
            <DialogTitle fontWeight={700}>
                {isEditMode ? intl.formatMessage({id: 'programs.modal.editProgram'}) : intl.formatMessage({id: 'programs.modal.addProgram'})}
            </DialogTitle>

            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1}}>
                {error && <Alert severity="error" sx={{borderRadius: '10px'}}>{error}</Alert>}

                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    <TextField
                        label={intl.formatMessage({id: 'programs.modal.yearFrom'})}
                        value={yearFrom}
                        onChange={(e) => {
                            setYearFrom(e.target.value);
                            setError(null);
                        }}
                        placeholder="2023"
                        fullWidth
                    />
                    <Typography sx={{fontWeight: 700, color: 'text.secondary'}}>/</Typography>
                    <TextField
                        label={intl.formatMessage({id: 'programs.modal.yearTo'})}
                        value={yearTo}
                        onChange={(e) => {
                            setYearTo(e.target.value);
                            setError(null);
                        }}
                        placeholder="2024"
                        fullWidth
                    />
                </Box>

                <TextField
                    label={intl.formatMessage({id: 'programs.modal.programName'})}
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    fullWidth
                    placeholder="np. Profil praktyczny"
                />
            </DialogContent>

            <DialogActions sx={{p: 3}}>
                <Button onClick={onClose} sx={{
                    fontWeight: 600,
                    color: 'text.secondary'
                }}>{intl.formatMessage({id: 'common.cancel'})}</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}
                        sx={{borderRadius: '10px', px: 4, fontWeight: 600}}>
                    {isSubmitting ? <CircularProgress size={24}/> : intl.formatMessage({id: 'common.save'})}
                </Button>
            </DialogActions>
        </Dialog>
    );
}