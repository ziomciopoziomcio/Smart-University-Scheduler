import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, Box, Button, TextField, MenuItem, CircularProgress} from '@mui/material';
import {useIntl} from 'react-intl';
import {
    type Course,
    type ClassType,
    type CourseInstructor,
    fetchFacultyInstructors,
    createCourseInstructor,
    updateCourseInstructor,
    type FacultyInstructor
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
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({employee: '', class_type: 'Lecture', hours: ''});

    useEffect(() => {
        if (open) {
            void fetchFacultyInstructors(facultyId).then(setEmployees);
            if (instructor) {
                setForm({
                    employee: instructor.employee.toString(),
                    class_type: instructor.class_type,
                    hours: instructor.hours.toString()
                });
            } else {
                setForm({employee: '', class_type: 'Lecture', hours: ''});
            }
        }
    }, [open, instructor, facultyId]);

    const handleSubmit = async () => {
        if (!course || !form.employee || !form.hours) return;
        setLoading(true);
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
        } catch (err) {
            alert(isEdit ? "Błąd aktualizacji" : "Błąd: Ten pracownik ma już przypisany ten typ zajęć!");
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
                        disabled={isEdit}
                        onChange={(e) => setForm({...form, class_type: e.target.value})}
                    >
                        {['Lecture', 'Tutorials', 'Laboratory', 'Seminar', 'Other'].map(t => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        sx={{flex: 1}}
                        type="number"
                        label={intl.formatMessage({id: 'didactics.instructors.hoursLabel'})}
                        value={form.hours}
                        onChange={(e) => setForm({...form, hours: e.target.value})}
                    />
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={loading || !form.employee || !form.hours}
                    sx={{borderRadius: '12px', bgcolor: '#2b5073', py: 1.5}}
                >
                    {loading ? <CircularProgress size={24}
                                                 color="inherit"/> : intl.formatMessage({id: 'didactics.common.save'})}
                </Button>
            </DialogContent>
        </Dialog>
    );
}