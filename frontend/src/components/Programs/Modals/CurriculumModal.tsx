import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, DialogTitle, DialogActions, Box,
    Button, TextField, CircularProgress, Autocomplete, FormControl, InputLabel, Select, MenuItem, Typography
} from '@mui/material';
import {useIntl} from 'react-intl';
import {
    createCurriculumCourse, fetchCourses, fetchMajors, fetchElectiveBlocks,
    type Course, type Major, type ElectiveBlock
} from '@api';

interface CurriculumModalProps {
    open: boolean;
    programId: number;
    semesterId: number;
    fieldId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function CurriculumModal({open, programId, semesterId, fieldId, onClose, onSuccess}: CurriculumModalProps) {
    const intl = useIntl();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [majorId, setMajorId] = useState<number | ''>('');
    const [blockId, setBlockId] = useState<number | ''>('');

    const [courseOptions, setCourseOptions] = useState<Course[]>([]);
    const [isSearchingCourses, setIsSearchingCourses] = useState(false);
    const [courseSearchInput, setCourseSearchInput] = useState('');

    const [majors, setMajors] = useState<Major[]>([]);
    const [blocks, setBlocks] = useState<ElectiveBlock[]>([]);

    useEffect(() => {
        if (open && fieldId) {
            fetchMajors(1, 100, undefined, {study_field: fieldId})
                .then(res => setMajors(res.items || []))
                .catch(console.error);

            fetchElectiveBlocks(1, 100, undefined, {study_field: fieldId})
                .then(res => setBlocks(res.items || []))
                .catch(console.error);
        }
    }, [open, fieldId]);

    useEffect(() => {
        if (!open) return;

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingCourses(true);
            try {
                const res = await fetchCourses(1, 20, courseSearchInput.length >= 2 ? courseSearchInput : undefined);
                setCourseOptions(res.items || []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearchingCourses(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [courseSearchInput, open]);

    useEffect(() => {
        if (!open) {
            setSelectedCourse(null);
            setMajorId('');
            setBlockId('');
            setCourseSearchInput('');
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!selectedCourse) return;
        setIsSubmitting(true);
        try {
            await createCurriculumCourse({
                study_program: programId,
                semester: semesterId,
                course: selectedCourse.course_code,
                major: majorId !== '' ? Number(majorId) : null,
                elective_block: blockId !== '' ? Number(blockId) : null
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth
                PaperProps={{sx: {borderRadius: '16px'}}}>
            <DialogTitle fontWeight={700}>
                {intl.formatMessage({id: 'programs.curriculumModal.title'})}
            </DialogTitle>

            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1, overflow: 'visible'}}>
                <Autocomplete
                    options={courseOptions}
                    getOptionLabel={(option) => `${option.course_code} - ${option.course_name}`}
                    value={selectedCourse}
                    onChange={(_, newValue) => setSelectedCourse(newValue)}
                    inputValue={courseSearchInput}
                    onInputChange={(_, newInputValue) => setCourseSearchInput(newInputValue)}
                    loading={isSearchingCourses}
                    noOptionsText={intl.formatMessage({id: 'programs.curriculumModal.courseNoOptions'})}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={intl.formatMessage({id: 'programs.curriculumModal.course'})}
                            placeholder={intl.formatMessage({id: 'programs.curriculumModal.coursePlaceholder'})}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isSearchingCourses ? <CircularProgress color="inherit" size={20}/> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />

                <Box sx={{display: 'flex', gap: 2}}>
                    <FormControl fullWidth disabled={blockId !== ''}>
                        <InputLabel
                            id="major-label">{intl.formatMessage({id: 'programs.curriculumModal.major'})}</InputLabel>
                        <Select
                            labelId="major-label"
                            value={majorId}
                            label={intl.formatMessage({id: 'programs.curriculumModal.major'})}
                            onChange={(e) => setMajorId(e.target.value as number | '')}
                        >
                            <MenuItem
                                value=""><em>{intl.formatMessage({id: 'programs.curriculumModal.none'})}</em></MenuItem>
                            {majors.map(m => <MenuItem key={m.id} value={m.id}>{m.major_name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={majorId !== ''}>
                        <InputLabel
                            id="block-label">{intl.formatMessage({id: 'programs.curriculumModal.electiveBlock'})}</InputLabel>
                        <Select
                            labelId="block-label"
                            value={blockId}
                            label={intl.formatMessage({id: 'programs.curriculumModal.electiveBlock'})}
                            onChange={(e) => setBlockId(e.target.value as number | '')}
                        >
                            <MenuItem
                                value=""><em>{intl.formatMessage({id: 'programs.curriculumModal.none'})}</em></MenuItem>
                            {blocks.map(b => <MenuItem key={b.id} value={b.id}>{b.elective_block_name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{mt: -1}}>
                    {intl.formatMessage({id: 'programs.curriculumModal.exclusivityHint'})}
                </Typography>
            </DialogContent>

            <DialogActions sx={{p: 3}}>
                <Button onClick={onClose} sx={{
                    fontWeight: 600,
                    color: 'text.secondary'
                }}>{intl.formatMessage({id: 'common.cancel'})}</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting || !selectedCourse}
                        sx={{borderRadius: '10px', px: 4, fontWeight: 600}}>
                    {isSubmitting ? <CircularProgress size={24}/> : intl.formatMessage({id: 'common.save'})}
                </Button>
            </DialogActions>
        </Dialog>
    );
}