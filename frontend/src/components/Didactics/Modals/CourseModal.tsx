import {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Button,
    Box,
    TextField,
    Alert,
    CircularProgress,
    MenuItem,
    Autocomplete,
    Checkbox,
    FormControlLabel,
    Divider
} from '@mui/material';
import {useIntl} from 'react-intl';
import {
    createCourse,
    updateCourse,
    fetchEmployees,
    getEmployee,
    fetchCourseTypes,
    createCourseType,
    updateCourseType,
    deleteCourseType,
    type Course,
    type Employee,
    type CourseTypeDetail,
    type CourseCreate
} from '@api';
import type {CourseLanguage, ClassType} from '@api/core';

interface CourseModalProps {
    open: boolean;
    course: Course | null;
    unitId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const CLASS_TYPES: ClassType[] = ['Lecture', 'Tutorials', 'Laboratory', 'Seminar', 'E-learning', 'Other'];

export default function CourseModal({open, course, unitId, onClose, onSuccess}: CourseModalProps) {
    const intl = useIntl();
    const isEdit = Boolean(course);

    const [code, setCode] = useState<number | ''>('');
    const [name, setName] = useState('');
    const [ects, setEcts] = useState<number | ''>('');
    const [language, setLanguage] = useState<CourseLanguage>('Polish');

    const [coordinator, setCoordinator] = useState<number | ''>('');
    const [selectedCoordinator, setSelectedCoordinator] = useState<Employee | null>(null);
    const [employeeSearchInput, setEmployeeSearchInput] = useState('');

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Class types state
    const [selectedTypes, setSelectedTypes] = useState<Record<ClassType, { enabled: boolean; hours: number; original?: CourseTypeDetail }>>(() => {
        return CLASS_TYPES.reduce<Record<ClassType, { enabled: boolean; hours: number; original?: CourseTypeDetail }>>((acc, t) => {
            acc[t] = {enabled: false, hours: 0};
            return acc;
        }, {} as Record<ClassType, { enabled: boolean; hours: number; original?: CourseTypeDetail }>);
    });

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(async () => {
            setLoadingEmployees(true);

            try {
                const searchValue = employeeSearchInput.trim();

                const res = await fetchEmployees(
                    1,
                    20,
                    searchValue.length >= 2 ? searchValue : undefined
                );

                setEmployees(res?.items || []);
            } catch (err) {
                console.error('Błąd podczas pobierania pracowników:', err);
                setEmployees([]);
            } finally {
                setLoadingEmployees(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [open, employeeSearchInput]);

    useEffect(() => {
        if (open) {
            setCode(course?.course_code || '');
            setName(course?.course_name || '');
            setEcts(course?.ects_points || '');
            setLanguage(course?.course_language || 'Polish');
            setCoordinator(course?.course_coordinator || '');
            setEmployeeSearchInput('');
            setError(null);

            if (course?.course_coordinator) {
                void getEmployee(course.course_coordinator).then(setSelectedCoordinator).catch(console.error);
            } else {
                setSelectedCoordinator(null);
            }

            // Reset class types
            const initialTypes = CLASS_TYPES.reduce<Record<ClassType, { enabled: boolean; hours: number; original?: CourseTypeDetail }>>((acc, t) => {
                acc[t] = {enabled: false, hours: 0};
                return acc;
            }, {} as Record<ClassType, { enabled: boolean; hours: number; original?: CourseTypeDetail }>);
            setSelectedTypes(initialTypes);

            if (course) {
                void fetchCourseTypes(course.course_code)
                    .then(res => {
                        const types = {...initialTypes};
                        res.items.forEach(item => {
                            types[item.class_type] = {enabled: true, hours: item.class_hours, original: item};
                        });
                        setSelectedTypes(types);
                    })
                    .catch(() => {
                        const message = intl.formatMessage({
                            id: 'didactics.courses.errorLoadTypes',
                            defaultMessage: 'Failed to load existing class types for this course. The editor will be closed to prevent saving incomplete data.'
                        });
                        setError(message);
                        window.alert(message);
                        onClose();
                    });
            }
        }
    }, [open, course, intl, onClose]);

    const handleTypeToggle = (type: ClassType) => {
        setSelectedTypes(prev => ({
            ...prev,
            [type]: {...prev[type], enabled: !prev[type].enabled}
        }));
    };

    const handleHoursChange = (type: ClassType, hours: string) => {
        const numericHours = hours === '' ? 0 : Number(hours);
        setSelectedTypes(prev => ({
            ...prev,
            [type]: {...prev[type], hours: Math.max(0, numericHours)}
        }));
    };

    const getDefaultConfigForType = (type: ClassType) => {
        switch (type) {
            case 'Lecture':
                return {pc_needed: false, max_group_participants_number: 150};
            case 'Laboratory':
                return {pc_needed: true, max_group_participants_number: 15};
            case 'Tutorials':
                return {pc_needed: false, max_group_participants_number: 30};
            case 'Seminar':
                return {pc_needed: false, max_group_participants_number: 20};
            default:
                return {pc_needed: false, max_group_participants_number: 15};
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || code === '' || ects === '' || coordinator === '') {
            setError(intl.formatMessage({id: 'didactics.common.errorRequired'}));
            return;
        }

        setLoading(true);
        setError(null);

        const payload: CourseCreate = {
            course_code: Number(code),
            course_name: name.trim(),
            ects_points: Number(ects),
            course_language: language,
            leading_unit: unitId,
            course_coordinator: Number(coordinator)
        };

        try {
            let finalCourseCode = Number(code);
            if (isEdit && course) {
                await updateCourse(course.course_code, payload);
            } else {
                const newCourse = await createCourse(payload);
                finalCourseCode = newCourse.course_code;
            }

            // Sync class types
            const promises = CLASS_TYPES.map(async (type) => {
                const state = selectedTypes[type];
                if (state.enabled) {
                    if (state.original) {
                        // Update existing
                        if (state.hours !== state.original.class_hours) {
                            await updateCourseType(finalCourseCode, type, {class_hours: state.hours});
                        }
                    } else {
                        // Create new with context-aware defaults
                        const config = getDefaultConfigForType(type);
                        await createCourseType({
                            course: finalCourseCode,
                            class_type: type,
                            class_hours: state.hours,
                            slots_per_class: 2,
                            frequency: 'Every_week',
                            manual_weeks: null,
                            projector_needed: true,
                            ...config
                        });
                    }
                } else if (state.original) {
                    // Delete removed
                    await deleteCourseType(finalCourseCode, type);
                }
            });

            await Promise.all(promises);

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
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 500}}}
        >
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3, mt: 2}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    {intl.formatMessage({id: isEdit ? 'didactics.courses.edit' : 'didactics.courses.add'})}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField
                        label={intl.formatMessage({id: 'didactics.courses.codeLabel'})}
                        required
                        type="number"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value === '' ? '' : Number(e.target.value));
                        }}
                        disabled={isEdit}
                        sx={{flex: 2}}
                        InputProps={{sx: {borderRadius: '12px'}}}
                    />

                    <TextField
                        label={intl.formatMessage({id: 'didactics.courses.ectsLabel'})}
                        required
                        type="number"
                        value={ects}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (value === '') {
                                setEcts('');
                                return;
                            }

                            const numericValue = Number(value);

                            if (numericValue >= 0) {
                                setEcts(numericValue);
                            }
                        }}
                        sx={{flex: 1}}
                        InputProps={{sx: {borderRadius: '12px'}}}
                    />
                </Box>

                <TextField
                    label={intl.formatMessage({id: 'didactics.courses.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'didactics.courses.namePlaceholder'})}
                    required
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Autocomplete
                    options={employees}
                    value={selectedCoordinator}
                    inputValue={employeeSearchInput}
                    loading={loadingEmployees}
                    filterOptions={(options) => options}
                    getOptionLabel={(option) =>
                        `${option.user.degree ? `${option.user.degree} ` : ''}${option.user.name} ${option.user.surname}`
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onInputChange={(_, newInputValue) => {
                        setEmployeeSearchInput(newInputValue);
                    }}
                    onChange={(_, newValue) => {
                        setSelectedCoordinator(newValue);
                        setCoordinator(newValue ? newValue.id : '');
                    }}
                    noOptionsText={intl.formatMessage({id: 'didactics.courses.noEmployees'})}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={intl.formatMessage({id: 'didactics.courses.coordinatorLabel'})}
                            required
                            fullWidth
                            InputProps={{
                                ...params.InputProps,
                                sx: {borderRadius: '12px'},
                                endAdornment: (
                                    <>
                                        {loadingEmployees ? (
                                            <CircularProgress color="inherit" size={20}/>
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />

                <TextField
                    select
                    label={intl.formatMessage({id: 'didactics.courses.languageLabel'})}
                    value={language}
                    onChange={(e) => {
                        setLanguage(e.target.value as CourseLanguage);
                    }}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                >
                    <MenuItem value="Polish">
                        {intl.formatMessage({id: 'didactics.courses.languagePolish'})}
                    </MenuItem>
                    <MenuItem value="English">
                        {intl.formatMessage({id: 'didactics.courses.languageEnglish'})}
                    </MenuItem>
                    <MenuItem value="French">
                        {intl.formatMessage({id: 'didactics.courses.languageFrench'})}
                    </MenuItem>
                </TextField>

                <Divider sx={{my: 1}} />

                <Typography variant="subtitle1" fontWeight="bold">
                    {intl.formatMessage({id: 'didactics.courses.classTypesTitle'})}
                </Typography>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                    {CLASS_TYPES.map(type => (
                        <Box key={type} sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedTypes[type].enabled}
                                        onChange={() => { handleTypeToggle(type); }}
                                        sx={{color: 'primary.main', '&.Mui-checked': {color: 'primary.main'}}}
                                    />
                                }
                                label={intl.formatMessage({id: `didactics.classTypes.${type}`})}
                                sx={{flex: 1}}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label={intl.formatMessage({id: 'didactics.courses.hoursLabel'})}
                                value={selectedTypes[type].hours}
                                onChange={(e) => { handleHoursChange(type, e.target.value); }}
                                disabled={!selectedTypes[type].enabled}
                                sx={{width: '120px'}}
                                InputProps={{sx: {borderRadius: '8px'}}}
                            />
                        </Box>
                    ))}
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => { void handleSubmit(); }}
                        disabled={loading || loadingEmployees}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': {bgcolor: 'primary.dark'}
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit"/>
                        ) : (
                            intl.formatMessage({
                                id: isEdit ? 'didactics.common.saveChanges' : 'didactics.courses.add'
                            })
                        )}
                    </Button>

                    <Button
                        variant="text"
                        fullWidth
                        onClick={onClose}
                        sx={{color: 'primary.main', textTransform: 'none', fontWeight: 600}}
                    >
                        {intl.formatMessage({id: 'didactics.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}