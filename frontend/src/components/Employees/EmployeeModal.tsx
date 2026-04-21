import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Box, Button, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Autocomplete, TextField
} from '@mui/material';
import {useIntl} from 'react-intl';
import {type Employee, type User, type Faculty, type Unit} from '@api/types';
import {createEmployee, updateEmployee} from '@api/academics';
import {fetchUsers} from '@api/users';
import {fetchFaculties, fetchUnits} from '@api/structures';

interface EmployeeModalProps {
    open: boolean;
    employee: Employee | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeModal({open, employee, onClose, onSuccess}: EmployeeModalProps) {
    const intl = useIntl();
    const isEditMode = Boolean(employee);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [facultyId, setFacultyId] = useState<number | ''>('');
    const [unitId, setUnitId] = useState<number | ''>('');

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    const [userSearchInputValue, setUserSearchInputValue] = useState('');
    const [userOptions, setUserOptions] = useState<User[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (!open) return;
        const loadInitialData = async () => {
            setIsLoadingData(true);
            try {
                const facultiesRes = await fetchFaculties();
                setFaculties(facultiesRes.items as Faculty[]);

                if (employee) {
                    setSelectedUser(employee.user);
                    setFacultyId(employee.faculty_id);
                    setUnitId(employee.unit_id || '');
                } else {
                    setSelectedUser(null);
                    setFacultyId('');
                    setUnitId('');
                }
            } catch {
                console.error(intl.formatMessage({id: 'academics.errors.loadDictionaries'}));
            } finally {
                setIsLoadingData(false);
            }
        };
        void loadInitialData();
    }, [open, employee, intl]);

    useEffect(() => {
        if (!facultyId) {
            setUnits([]);
            return;
        }
        const loadUnits = async () => {
            try {
                const res = await fetchUnits(Number(facultyId));
                setUnits(res.items as Unit[]);
            } catch (err) {
                console.error("Failed to load units", err);
            }
        };
        void loadUnits();
    }, [facultyId]);

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
        if (!selectedUser || !facultyId || !unitId) return;
        setIsSubmitting(true);
        try {
            const payload = {
                user_id: selectedUser.id,
                faculty_id: Number(facultyId),
                unit_id: Number(unitId)
            };

            if (isEditMode && employee) {
                await updateEmployee(employee.id, {faculty_id: payload.faculty_id, unit_id: payload.unit_id});
            } else {
                await createEmployee(payload);
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
                    {intl.formatMessage({id: isEditMode ? 'academics.employees.titleEdit' : 'academics.employees.titleAdd'})}
                </Typography>

                <Autocomplete
                    disabled={isEditMode || isLoadingData}
                    options={userOptions}
                    getOptionLabel={(option) => `${option.name} ${option.surname} (${option.email})`}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={selectedUser}
                    onChange={(_, newValue) => {
                        setSelectedUser(newValue);
                    }}
                    onInputChange={(_, newInputValue) => {
                        setUserSearchInputValue(newInputValue);
                    }} noOptionsText={intl.formatMessage({id: 'academics.employees.noOptionsText'})}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={intl.formatMessage({id: 'academics.employees.userLabel'})}
                            InputProps={{
                                ...params.InputProps,
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
                    <InputLabel>{intl.formatMessage({id: 'academics.employees.facultyLabel'})}</InputLabel>
                    <Select value={facultyId} label={intl.formatMessage({id: 'academics.employees.facultyLabel'})}
                            onChange={(e) => {
                                setFacultyId(e.target.value as number);
                                setUnitId('');
                            }}>
                        {faculties.map(f => <MenuItem key={f.id} value={f.id}>{f.faculty_short}</MenuItem>)}
                    </Select>
                </FormControl>

                <FormControl fullWidth disabled={!facultyId || isLoadingData}>
                    <InputLabel>{intl.formatMessage({id: 'academics.employees.unitLabel'})}</InputLabel>
                    <Select value={unitId} label={intl.formatMessage({id: 'academics.employees.unitLabel'})}
                            onChange={(e) => {
                                setUnitId(e.target.value as number);
                            }}>
                        {units.map(u => <MenuItem key={u.id} value={u.id}>{u.unit_name}</MenuItem>)}
                    </Select>
                </FormControl>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained" fullWidth onClick={() => {
                        void handleSubmit();
                    }}
                        disabled={isSubmitting || !selectedUser || !facultyId || !unitId || isLoadingData}
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