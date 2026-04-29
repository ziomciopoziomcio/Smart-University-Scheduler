import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Box, Button, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Autocomplete, TextField,
    InputAdornment
} from '@mui/material';
import {Search} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {
    type Employee, type User, type Faculty, type Unit,
    createEmployee, updateEmployee, fetchFaculties, fetchUnits, fetchUsers
} from '@api';

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

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setIsLoadingData(true);
            fetchFaculties(1, 100)
                .then(res => {
                    setFaculties(res.items || res);
                })
                .catch(console.error)
                .finally(() => {
                    setIsLoadingData(false);
                });
        }
    }, [open]);

    useEffect(() => {
        if (facultyId) {
            fetchUnits(Number(facultyId), 1, 100)
                .then(res => setUnits(res.items || res))
                .catch(console.error);
        } else {
            setUnits([]);
        }
    }, [facultyId]);

    useEffect(() => {
        if (open && employee) {
            setSelectedUser(employee.user);
            setUserOptions([employee.user]);
            setFacultyId(employee.faculty_id);
            setUnitId(employee.unit_id);
            setUserSearchInputValue(`${employee.user.name} ${employee.user.surname}`);
        } else if (open && !employee) {
            setSelectedUser(null);
            setUserOptions([]);
            setFacultyId('');
            setUnitId('');
            setUserSearchInputValue('');
        }
    }, [open, employee]);

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
                console.error('Błąd szukania userów:', error);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [userSearchInputValue, selectedUser]);

    const handleSubmit = async () => {
        if (!selectedUser || !facultyId || !unitId) return;
        setIsSubmitting(true);
        try {
            if (isEditMode && employee) {
                await updateEmployee(employee.id, {faculty_id: Number(facultyId), unit_id: Number(unitId)});
            } else {
                await createEmployee({
                    user_id: selectedUser.id,
                    faculty_id: Number(facultyId),
                    unit_id: Number(unitId)
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
                    {isEditMode
                        ? intl.formatMessage({id: 'academics.employees.edit'})
                        : intl.formatMessage({id: 'academics.employees.add'})}
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
                        ? intl.formatMessage({id: 'academics.employees.modal.noResults'})
                        : intl.formatMessage({id: 'academics.employees.modal.searchPrompt'})}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={intl.formatMessage({id: 'academics.employees.userLabel'})}
                            placeholder={intl.formatMessage({id: 'academics.employees.modal.userSearchLabel'})}
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
                    <InputLabel>{intl.formatMessage({id: 'academics.employees.facultyLabel'})}</InputLabel>
                    <Select
                        value={facultyId}
                        label={intl.formatMessage({id: 'academics.employees.facultyLabel'})}
                        onChange={(e) => {
                            setFacultyId(e.target.value as number);
                            setUnitId('');
                        }}
                    >
                        {faculties.map(f => <MenuItem key={f.id} value={f.id}>{f.faculty_short}</MenuItem>)}
                    </Select>
                </FormControl>

                <FormControl fullWidth disabled={!facultyId || isLoadingData}>
                    {/*TODO: fix label width bug*/}
                    <InputLabel>{intl.formatMessage({id: 'academics.employees.unitLabel'})}</InputLabel>
                    <Select
                        value={unitId}
                        label={intl.formatMessage({id: 'academics.employees.unitLabel'})}
                        onChange={(e) => setUnitId(e.target.value as number)}
                    >
                        {units.map(u => <MenuItem key={u.id} value={u.id}>{u.unit_name}</MenuItem>)}
                    </Select>
                </FormControl>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedUser || !facultyId || !unitId || isLoadingData}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            background: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {isSubmitting
                            ? <CircularProgress size={24} color="inherit"/>
                            : intl.formatMessage({id: 'academics.common.save'})}
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