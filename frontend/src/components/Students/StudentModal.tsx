import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Box, Button, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Autocomplete, TextField
} from '@mui/material';
import {useIntl} from 'react-intl';
import {
    type Student,
    type User,
    type StudyProgramDetails,
    type MajorDetails,
    createStudent,
    updateStudent,
    fetchUsers,
    fetchStudyPrograms,
    fetchMajors
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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (!open) return;

        const loadStaticData = async () => {
            setIsLoadingData(true);
            try {
                const [programsRes, majorsRes] = await Promise.allSettled([
                    fetchStudyPrograms(200, 0),
                    fetchMajors(200, 0)
                ]);

                if (programsRes.status === 'fulfilled') {
                    setPrograms(programsRes.value.items);
                } else {
                    throw new Error("Błąd pobierania kierunków");
                }

                if (majorsRes.status === 'fulfilled') {
                    setMajors(majorsRes.value.items);
                } else {
                    throw new Error("Błąd pobierania specjalności");
                }

                if (student) {
                    setSelectedUser(student.user);
                    setStudyProgramId(student.study_program);
                    setMajorId(student.major || '');
                } else {
                    setSelectedUser(null);
                    setStudyProgramId('');
                    setMajorId('');
                }
            } catch (err) {
                console.error("Błąd modala:", err);
            } finally {
                setIsLoadingData(false);
            }
        };

        void loadStaticData();
    }, [open, student]);

    useEffect(() => {
        if (userSearchInputValue.length < 3) {
            setUserOptions(selectedUser ? [selectedUser] : []);
            setIsSearchingUsers(false);
            return;
        }

        setIsSearchingUsers(true);

        const delayDebounceFn = setTimeout(() => {
            void (async () => {
                try {
                    const res = await fetchUsers(20, 0, userSearchInputValue);
                    setUserOptions(res.items);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsSearchingUsers(false);
                }
            })();
        }, 500);

        return () => {
            clearTimeout(delayDebounceFn);
        };
    }, [userSearchInputValue, selectedUser]);

    const handleSubmit = async () => {
        if (!selectedUser || !studyProgramId) return;
        setIsSubmitting(true);
        try {
            const payload = {
                user_id: selectedUser.id,
                study_program: Number(studyProgramId),
                major: majorId ? Number(majorId) : null
            };

            if (isEditMode && student) {
                await updateStudent(student.id, {study_program: payload.study_program, major: payload.major});
            } else {
                await createStudent(payload);
            }
            onSuccess();
            onClose();
        } catch {
            alert(intl.formatMessage({id: 'academics.errors.save'}));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 420}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {intl.formatMessage({id: isEditMode ? 'academics.students.titleEdit' : 'academics.students.titleAdd'})}
                </Typography>

                {isLoadingData ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>
                ) : (
                    <>
                        <Autocomplete
                            disabled={isEditMode}
                            options={userOptions}
                            getOptionLabel={(option) => `${option.name} ${option.surname} (${option.email})`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={selectedUser}
                            onChange={(_, newValue) => {
                                setSelectedUser(newValue);
                            }}
                            onInputChange={(_, newInputValue) => {
                                setUserSearchInputValue(newInputValue);
                            }}

                            noOptionsText={intl.formatMessage({id: 'academics.students.noOptionsText'})}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={intl.formatMessage({id: 'academics.students.userLabel'})}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {isSearchingUsers ?
                                                    <CircularProgress color="inherit" size={20}/> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <FormControl fullWidth>
                            <InputLabel>{intl.formatMessage({id: 'academics.students.programLabel'})}</InputLabel>
                            <Select
                                value={studyProgramId}
                                label={intl.formatMessage({id: 'academics.students.programLabel'})}
                                onChange={(e) => {
                                    setStudyProgramId(e.target.value as number);
                                }}
                            >
                                {programs.map(p => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.program_name || `Kierunek ID: ${p.study_field} (Start: ${p.start_year})`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>{intl.formatMessage({id: 'academics.students.majorLabel'})}</InputLabel>
                            <Select
                                value={majorId}
                                label={intl.formatMessage({id: 'academics.students.majorLabel'})}
                                onChange={(e) => {
                                    setMajorId(e.target.value as number);
                                }}
                            >
                                <MenuItem
                                    value=""><em>{intl.formatMessage({id: 'academics.students.majorNone'})}</em></MenuItem>
                                {majors.map(m => (
                                    <MenuItem key={m.id} value={m.id}>{m.major_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </>
                )}

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained" fullWidth onClick={() => {
                        void handleSubmit();
                    }}
                        disabled={isSubmitting || !selectedUser || !studyProgramId || isLoadingData}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: '#2b5073',
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