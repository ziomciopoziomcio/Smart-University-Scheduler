import {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {useIntl} from 'react-intl';
import {type Student, type User, type StudyProgramDetails, type MajorDetails} from '@api/types';
import {createStudent, updateStudent} from '@api/academics';
import {fetchUsers} from '@api/users';
import {fetchStudyPrograms, fetchMajors} from '@api/courses';

interface StudentModalProps {
    open: boolean;
    student: Student | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StudentModal({open, student, onClose, onSuccess}: StudentModalProps) {
    const intl = useIntl();
    const isEditMode = Boolean(student);

    const [userId, setUserId] = useState<number | ''>('');
    const [studyProgramId, setStudyProgramId] = useState<number | ''>('');
    const [majorId, setMajorId] = useState<number | ''>('');

    const [users, setUsers] = useState<User[]>([]);
    const [programs, setPrograms] = useState<StudyProgramDetails[]>([]);
    const [majors, setMajors] = useState<MajorDetails[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (!open) return;

        const loadData = async () => {
            setIsLoadingData(true);
            try {
                const [usersRes, programsRes, majorsRes] = await Promise.allSettled([
                    fetchUsers(200, 0),
                    fetchStudyPrograms(200, 0),
                    fetchMajors(200, 0)
                ]);

                if (usersRes.status === 'fulfilled') {
                    setUsers(usersRes.value.items);
                } else {
                    console.error("Błąd pobierania użytkowników", usersRes.reason);
                }

                if (programsRes.status === 'fulfilled') {
                    setPrograms(programsRes.value.items);
                } else {
                    console.error("Błąd pobierania kierunków", programsRes.reason);
                }

                if (majorsRes.status === 'fulfilled') {
                    setMajors(majorsRes.value.items);
                } else {
                    console.error("Błąd pobierania specjalności", majorsRes.reason);
                }

                if (student) {
                    setUserId(student.user_id);
                    setStudyProgramId(student.study_program);
                    setMajorId(student.major || '');
                } else {
                    setUserId('');
                    setStudyProgramId('');
                    setMajorId('');
                }
            } catch (err) {
                console.error("Nieoczekiwany błąd modala", err);
            } finally {
                setIsLoadingData(false);
            }
        };

        void loadData();
    }, [open, student, intl]);

    const handleSubmit = async () => {
        if (!userId || !studyProgramId) return;
        setIsSubmitting(true);
        try {
            const payload = {
                user_id: Number(userId),
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
                        <FormControl fullWidth disabled={isEditMode}>
                            <InputLabel>{intl.formatMessage({id: 'academics.students.userLabel'})}</InputLabel>
                            <Select
                                value={userId}
                                label={intl.formatMessage({id: 'academics.students.userLabel'})}
                                onChange={(e) => setUserId(e.target.value as number)}
                            >
                                {!isEditMode && <MenuItem value=""
                                                          disabled>{intl.formatMessage({id: 'academics.students.chooseUser'})}</MenuItem>}

                                {isEditMode && student && (
                                    <MenuItem value={student.user_id}>
                                        {student.user.name} {student.user.surname} ({student.user.email})
                                    </MenuItem>
                                )}
                                {!isEditMode && users.map(u => (
                                    <MenuItem key={u.id} value={u.id}>{u.name} {u.surname} ({u.email})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>{intl.formatMessage({id: 'academics.students.programLabel'})}</InputLabel>
                            <Select
                                value={studyProgramId}
                                label={intl.formatMessage({id: 'academics.students.programLabel'})}
                                onChange={(e) => setStudyProgramId(e.target.value as number)}
                            >
                                <MenuItem value=""
                                          disabled>{intl.formatMessage({id: 'academics.students.chooseProgram'})}</MenuItem>
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
                                onChange={(e) => setMajorId(e.target.value as number)}
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
                        disabled={isSubmitting || !userId || !studyProgramId || isLoadingData}
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