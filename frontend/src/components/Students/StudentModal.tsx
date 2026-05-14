import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Box, Button, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Autocomplete, TextField, InputAdornment
} from '@mui/material';
import {Search} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {
    type Student, type User, type StudyProgramDetails, type MajorDetails,
    createStudent, updateStudent, fetchUsers, fetchStudyPrograms, fetchMajors
} from '@api';

interface StudentModalProps {
    open: boolean;
    student: Student | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StudentModal({open, student, onClose, onSuccess}: StudentModalProps) {
    const intl = useIntl();
    const isEditMode = Boolean(student);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [studyProgramId, setStudyProgramId] = useState<number | ''>('');
    const [majorId, setMajorId] = useState<number | ''>('');

    const [programs, setPrograms] = useState<StudyProgramDetails[]>([]);
    const [majors, setMajors] = useState<MajorDetails[]>([]);

    const [userSearchInputValue, setUserSearchInputValue] = useState('');
    const [userOptions, setUserOptions] = useState<User[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setIsLoadingData(true);
            Promise.all([
                fetchStudyPrograms(1, 100),
                fetchMajors(1, 100)
            ])
                .then(([programsRes, majorsRes]) => {
                    setPrograms(programsRes.items || []);
                    setMajors(majorsRes.items || []);
                })
                .catch(console.error)
                .finally(() => {
                    setIsLoadingData(false);
                });
        }
    }, [open]);

    useEffect(() => {
        if (open && student) {
            setSelectedUser(student.user);
            setUserOptions([student.user]);
            setStudyProgramId(student.study_program);
            setMajorId(student.major || '');
            setUserSearchInputValue(`${student.user.name} ${student.user.surname}`);
        } else if (open && !student) {
            setSelectedUser(null);
            setUserOptions([]);
            setStudyProgramId('');
            setMajorId('');
            setUserSearchInputValue('');
        }
    }, [open, student]);

    useEffect(() => {
        if (userSearchInputValue.trim().length < 1) {
            if (!selectedUser) setUserOptions([]);
            return;
        }

        const handler = setTimeout(async () => {
            setIsSearchingUsers(true);
            try {
                const res = await fetchUsers(20, 0, userSearchInputValue);
                setUserOptions(res.items || []);
            } catch (error) {
                console.error('Błąd pobierania użytkowników:', error);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [userSearchInputValue, selectedUser]);

    const handleSubmit = async () => {
        if (!selectedUser || !studyProgramId) return;
        setIsSubmitting(true);
        try {
            const payload = {
                study_program: Number(studyProgramId),
                major: majorId ? Number(majorId) : null
            };

            if (isEditMode && student) {
                await updateStudent(student.id, payload);
            } else {
                await createStudent({
                    user_id: selectedUser.id,
                    ...payload
                });
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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{sx: {borderRadius: '20px', p: 1}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3, pt: 4}}>
                <Typography variant="h5" fontWeight={700} color="#2b5073" sx={{mb: 1}}>
                    {isEditMode ? intl.formatMessage({id: 'academics.students.edit'}) : intl.formatMessage({id: 'academics.students.add'})}
                </Typography>

                <Autocomplete
                    options={userOptions}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    getOptionLabel={(option) => `${option.name} ${option.surname} (${option.email})`}
                    value={selectedUser}
                    onChange={(_, newValue) => setSelectedUser(newValue)}
                    inputValue={userSearchInputValue}
                    onInputChange={(_, newInputValue) => setUserSearchInputValue(newInputValue)}
                    filterOptions={(x) => x}
                    loading={isSearchingUsers}
                    disabled={isEditMode || isLoadingData}
                    noOptionsText={userSearchInputValue.length > 0
                        ? intl.formatMessage({id: 'academics.students.modal.noResults'})
                        : intl.formatMessage({id: 'academics.students.modal.searchPrompt'})}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={intl.formatMessage({id: 'academics.students.modal.user'})}
                            placeholder={intl.formatMessage({id: 'academics.students.modal.userSearchLabel'})}
                            variant="outlined"
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search color="action" fontSize="small"/>
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <>
                                        {isSearchingUsers ? <CircularProgress color="inherit" size={20}/> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />

                <FormControl fullWidth disabled={isLoadingData}>
                    <InputLabel>{intl.formatMessage({id: 'academics.students.modal.studyProgram'})}</InputLabel>
                    <Select value={studyProgramId}
                            label={intl.formatMessage({id: 'academics.students.modal.studyProgram'})}
                            onChange={(e) => {
                                setStudyProgramId(e.target.value as number);
                            }}>
                        {programs.map(p => <MenuItem key={p.id} value={p.id}>{p.program_name || p.id}</MenuItem>)}
                    </Select>
                </FormControl>

                <FormControl fullWidth disabled={!studyProgramId || isLoadingData}>
                    <InputLabel>{intl.formatMessage({id: 'academics.students.modal.major'})}</InputLabel>
                    <Select value={majorId} label={intl.formatMessage({id: 'academics.students.modal.major'})}
                            onChange={(e) => {
                                setMajorId(e.target.value as number);
                            }}>
                        <MenuItem
                            value=""><em>{intl.formatMessage({id: 'academics.students.majorNone'})}</em></MenuItem> {majors.map(m =>
                        <MenuItem key={m.id} value={m.id}>{m.major_name}</MenuItem>)}
                    </Select>
                </FormControl>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained" fullWidth onClick={handleSubmit}
                        disabled={isSubmitting || !selectedUser || !studyProgramId || isLoadingData}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            background: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24}
                                                          color="inherit"/> : intl.formatMessage({id: 'academics.common.save'})}
                    </Button>
                    <Button variant="text" fullWidth onClick={onClose} disabled={isSubmitting}
                            sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}>
                        {intl.formatMessage({id: 'academics.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}