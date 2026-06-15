import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, Box, TextField, MenuItem, Alert} from '@mui/material';
import {useIntl} from 'react-intl';
import { AppButton } from '@components/Common';
import {
    type Course,
    type ClassType,
    type CourseInstructor,
    fetchFacultyInstructors,
    createCourseInstructor,
    updateCourseInstructor,
    fetchCourseTypes,
    type FacultyInstructor,
    type CourseTypeDetail
} from '@api';

interface Props {
    open: boolean;
    course: Course | null;
    instructor: CourseInstructor | null;
    facultyId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function CourseInstructorModal({open, course, instructor, facultyId, onClose, onSuccess}: Props) {
    const intl = useIntl();
    const isEdit = Boolean(instructor);

    const [employees, setEmployees] = useState<FacultyInstructor[]>([]);
    const [availableTypes, setAvailableTypes] = useState<CourseTypeDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({employee: '', class_type: '', hours: ''});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setError(null);
            void fetchFacultyInstructors(facultyId)
                .then(setEmployees)
                .catch(() => {
                    setEmployees([]);
                    setError('Failed to load instructors.');
                });
            if (course) {
                void fetchCourseTypes(course.course_code)
                    .then(res => {
                        setAvailableTypes(res.items);
                        if (!instructor && res.items.length > 0) {
                            setForm(f => ({...f, class_type: res.items[0].class_type}));
                        }
                    })
                    .catch(() => {
                        setAvailableTypes([]);
                        setError('Failed to load course types.');
                    });
            }
            if (instructor) {
                setForm({
                    employee: instructor.employee.toString(),
                    class_type: instructor.class_type,
                    hours: instructor.hours.toString()
                });
            } else {
                setForm({employee: '', class_type: '', hours: ''});
            }
        }
    }, [open, instructor, facultyId, course]);

    const handleSubmit = async () => {
        if (!course || !form.employee || !form.hours || !form.class_type) return;
        setLoading(true);
        setError(null);
        try {
            if (isEdit && instructor) {
                await updateCourseInstructor(instructor.employee, course.course_code, instructor.class_type, {
                    hours: Number(form.hours)
                });
            } else {
                await createCourseInstructor({
                    employee: Number(form.employee),
                    course: course.course_code,
                    class_type: form.class_type as ClassType,
                    hours: Number(form.hours)
                });
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : (isEdit ? "Błąd aktualizacji" : "Błąd przypisania");
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} slotProps={{paper: {sx: {borderRadius: '24px', p: 1, minWidth: 450}}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h6" fontWeight="bold" textAlign="center">
                    {intl.formatMessage({id: isEdit ? 'didactics.common.edit' : 'didactics.instructors.add'})}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                {!isEdit && availableTypes.length === 0 && !loading && (
                    <Alert severity="warning">
                        {intl.formatMessage({id: 'didactics.instructors.noTypesWarning'})}
                    </Alert>
                )}

                <TextField
                    select
                    fullWidth
                    label={intl.formatMessage({id: 'didactics.instructors.employeeLabel'})}
                    value={form.employee}
                    disabled={isEdit}
                    onChange={(e) => setForm({...form, employee: e.target.value})}
                >
                    {employees.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>{emp.degree} {emp.name} {emp.surname}</MenuItem>
                    ))}
                </TextField>

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField
                        select
                        sx={{flex: 1.5}}
                        label={intl.formatMessage({id: 'didactics.instructors.classTypeLabel'})}
                        value={form.class_type}
                        disabled={isEdit || availableTypes.length === 0}
                        onChange={(e) => setForm({...form, class_type: e.target.value})}
                    >
                        {availableTypes.map(t => (
                            <MenuItem key={t.class_type} value={t.class_type}>
                                {intl.formatMessage({id: `didactics.classTypes.${t.class_type}`})} ({t.class_hours}h)
                            </MenuItem>
                        ))}
                        {isEdit && instructor && !availableTypes.some(t => t.class_type === instructor.class_type) && (
                            <MenuItem key={instructor.class_type} value={instructor.class_type} disabled>
                                {intl.formatMessage({id: `didactics.classTypes.${instructor.class_type}`})} (usunięty z przedmiotu)
                            </MenuItem>
                        )}
                    </TextField>

                    <TextField
                        sx={{flex: 1}}
                        type="number"
                        label={intl.formatMessage({id: 'didactics.instructors.hoursLabel'})}
                        value={form.hours}
                        onChange={(e) => setForm({...form, hours: e.target.value})}
                    />
                </Box>

                <AppButton variant="contained" onClick={handleSubmit} loading={loading} disabled={loading || !form.employee || !form.hours || !form.class_type || (!isEdit && availableTypes.length === 0)}>
                        {intl.formatMessage({id: 'didactics.common.save'})}
                    </AppButton>
            </DialogContent>
        </Dialog>
    );
}