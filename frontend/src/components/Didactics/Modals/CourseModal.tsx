import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, Typography, Button, Box,
    TextField, Alert, CircularProgress, MenuItem
} from '@mui/material';
import { useIntl } from 'react-intl';
import { createCourse, updateCourse, fetchEmployees, type Course, type Employee } from '@api';
import type { CourseLanguage } from '@api/core';

interface CourseModalProps {
    open: boolean;
    course: Course | null;
    unitId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CourseModal({ open, course, unitId, onClose, onSuccess }: CourseModalProps) {
    const intl = useIntl();
    const isEdit = Boolean(course);

    const [code, setCode] = useState<number | ''>('');
    const [name, setName] = useState('');
    const [ects, setEcts] = useState<number | ''>('');
    const [language, setLanguage] = useState<CourseLanguage>('Polish');
    const [coordinator, setCoordinator] = useState<number | ''>('');

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadEmployees = async () => {
            if (!open) return;
            setLoadingEmployees(true);
            try {
                // TODO: Implement filtering on the backend via query params
                const res = await fetchEmployees(10, 0);
                setEmployees(res?.items || []);
            } catch (err) {
                console.error("Błąd podczas pobierania pracowników:", err);
            } finally {
                setLoadingEmployees(false);
            }
        };

        void loadEmployees();
    }, [open]);

    useEffect(() => {
        if (open) {
            setCode(course?.course_code || '');
            setName(course?.course_name || '');
            setEcts(course?.ects_points || '');
            setLanguage(course?.course_language || 'Polish');
            setCoordinator(course?.course_coordinator || '');
            setError(null);
        }
    }, [open, course]);

    const handleSubmit = async () => {
        if (!name.trim() || code === '' || ects === '' || coordinator === '') {
            setError(intl.formatMessage({ id: 'didactics.common.errorRequired' }));
            return;
        }

        setLoading(true);
        setError(null);

        const payload = {
            course_code: Number(code),
            course_name: name.trim(),
            ects_points: Number(ects),
            course_language: language,
            leading_unit: unitId,
            course_coordinator: Number(coordinator)
        };

        try {
            if (isEdit && course) {
                await updateCourse(course.course_code, payload);
            } else {
                await createCourse(payload as any);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || intl.formatMessage({ id: 'didactics.common.errorSave' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '24px', p: 1, minWidth: 450 } }}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    {intl.formatMessage({ id: isEdit ? 'didactics.courses.edit' : 'didactics.courses.add' })}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/*TODO: Code is PK in database - logic business around it*/}
                    <TextField
                        label={intl.formatMessage({ id: 'didactics.courses.codeLabel' })}
                        required
                        type="number"
                        value={code}
                        onChange={(e) => setCode(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={isEdit}
                        sx={{ flex: 2 }}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                    <TextField
                        label={intl.formatMessage({ id: 'didactics.courses.ectsLabel' })}
                        required
                        type="number"
                        value={ects}
                        onChange={(e) => setEcts(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{ flex: 1 }}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                </Box>

                <TextField
                    label={intl.formatMessage({ id: 'didactics.courses.nameLabel' })}
                    placeholder={intl.formatMessage({ id: 'didactics.courses.namePlaceholder' })}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    InputProps={{ sx: { borderRadius: '12px' } }}
                />

                <TextField
                    select
                    label={intl.formatMessage({ id: 'didactics.courses.coordinatorLabel' })}
                    required
                    value={coordinator}
                    onChange={(e) => setCoordinator(e.target.value as unknown as number)}
                    fullWidth
                    disabled={loadingEmployees}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                >
                    {loadingEmployees ? (
                        <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 2 }} />
                            {intl.formatMessage({ id: 'didactics.courses.coordinatorLoading' })}
                        </MenuItem>
                    ) : employees.length === 0 ? (
                        <MenuItem disabled>
                            {intl.formatMessage({ id: 'didactics.courses.noEmployees' })}
                        </MenuItem>
                    ) : (
                        employees.map((emp) => (

                            <MenuItem key={emp.id} value={emp.id}>
                                {emp.user.degree} {emp.user.name} {emp.user.surname}
                            </MenuItem>
                        ))
                    )}
                </TextField>

                <TextField
                    select
                    label={intl.formatMessage({ id: 'didactics.courses.languageLabel' })}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as CourseLanguage)}
                    fullWidth
                    InputProps={{ sx: { borderRadius: '12px' } }}
                >
                    <MenuItem value="Polish">{intl.formatMessage({ id: 'didactics.courses.languagePolish' })}</MenuItem>
                    <MenuItem value="English">{intl.formatMessage({ id: 'didactics.courses.languageEnglish' })}</MenuItem>
                    <MenuItem value="French">{intl.formatMessage({ id: 'didactics.courses.languageFrench' })}</MenuItem>
                </TextField>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={loading || loadingEmployees}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            background: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': { bgcolor: '#1a3a56' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : intl.formatMessage({ id: isEdit ? 'didactics.common.saveChanges' : 'didactics.courses.add' })}
                    </Button>
                    <Button variant="text" fullWidth onClick={onClose} sx={{ color: '#2b5073', textTransform: 'none', fontWeight: 600 }}>
                        {intl.formatMessage({ id: 'didactics.common.cancel' })}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}