import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Box, Button, CircularProgress,
    TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {useIntl} from 'react-intl';
import {type User} from '@api/types';
import {createUser, updateUser} from '@api/users';
import AuthPasswordField from '@components/Login/AuthPasswordField';

interface UserModalProps {
    open: boolean;
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserModal({open, user, onClose, onSuccess}: UserModalProps) {
    const intl = useIntl();
    const isEditMode = Boolean(user);

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [degree, setDegree] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (open) {
            if (user) {
                setEmail(user.email);
                setName(user.name);
                setSurname(user.surname);
                setPhone(user.phone_number || '');
                setDegree(user.degree || '');
            } else {
                setEmail('');
                setName('');
                setSurname('');
                setPhone('');
                setDegree('');
            }
            setPassword('');
            setPasswordConfirm('');
            setShowPassword(false);
        }
    }, [open, user]);

    // eslint-disable-next-line complexity
    const handleSubmit = async () => {

        // This is a client-side check, not a security-sensitive operation, thus timing attacks are not a concern here.
        // eslint-disable-next-line security/detect-possible-timing-attacks
        if (password !== passwordConfirm) {
            alert(intl.formatMessage({id: 'users.errors.passwordMismatch'}));
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditMode && user) {
                const updatePayload: Record<string, unknown> = {
                    name,
                    surname,
                    email,
                    phone_number: phone || null,
                    degree: degree || null
                };
                if (password) {
                    updatePayload.password = password;
                    updatePayload.password2 = passwordConfirm;
                }
                await updateUser(user.id, updatePayload);
            } else {
                await createUser({
                    email,
                    name,
                    surname,
                    phone_number: phone || null,
                    degree: degree || null,
                    password,
                    password2: passwordConfirm
                });
            }
            onSuccess();
            onClose();
        } catch {
            alert(intl.formatMessage({id: 'users.errors.save'}));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const isFormValid = isEditMode
        ? (email && name && surname)
        : (email && name && surname && password && passwordConfirm);

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 420}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {intl.formatMessage({id: isEditMode ? 'users.modal.titleEdit' : 'users.modal.titleAdd'})}
                </Typography>

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField fullWidth label={intl.formatMessage({id: 'users.modal.nameLabel'})} value={name}
                               onChange={(e) => {
                                   setName(e.target.value);
                               }} disabled={isSubmitting}/>
                    <TextField fullWidth label={intl.formatMessage({id: 'users.modal.surnameLabel'})} value={surname}
                               onChange={(e) => {
                                   setSurname(e.target.value);
                               }} disabled={isSubmitting}/>
                </Box>

                <TextField fullWidth label={intl.formatMessage({id: 'users.modal.emailLabel'})} value={email}
                           onChange={(e) => {
                               setEmail(e.target.value);
                           }} disabled={isSubmitting}/>

                <Box sx={{display: 'flex', gap: 2}}>
                    <FormControl fullWidth disabled={isSubmitting}>
                        <InputLabel>{intl.formatMessage({id: 'users.modal.degreeLabel'})}</InputLabel>
                        <Select value={degree} label={intl.formatMessage({id: 'users.modal.degreeLabel'})}
                                onChange={(e) => {
                                    setDegree(e.target.value);
                                }}>
                            <MenuItem value=""><em>{intl.formatMessage({id: 'register.degrees.none'})}</em></MenuItem>
                            <MenuItem value="inz">{intl.formatMessage({id: 'register.degrees.inz'})}</MenuItem>
                            <MenuItem value="mgr">{intl.formatMessage({id: 'register.degrees.mgr'})}</MenuItem>
                            <MenuItem value="dr">{intl.formatMessage({id: 'register.degrees.dr'})}</MenuItem>
                            <MenuItem value="dr_hab">{intl.formatMessage({id: 'register.degrees.dr_hab'})}</MenuItem>
                            <MenuItem value="prof">{intl.formatMessage({id: 'register.degrees.prof'})}</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField fullWidth label={intl.formatMessage({id: 'users.modal.phoneLabel'})} value={phone}
                               onChange={(e) => {
                                   setPhone(e.target.value);
                               }} disabled={isSubmitting}/>
                </Box>

                <AuthPasswordField
                    label={intl.formatMessage({id: isEditMode ? 'users.modal.passwordEditLabel' : 'users.modal.passwordLabel'})}
                    placeholder=""
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                    disabled={isSubmitting}
                    showPassword={showPassword}
                    onTogglePassword={handleTogglePassword}
                />

                {(!isEditMode || password.length > 0) && (
                    <AuthPasswordField
                        label={intl.formatMessage({id: 'users.modal.password2Label'})}
                        placeholder=""
                        value={passwordConfirm}
                        onChange={(e) => {
                            setPasswordConfirm(e.target.value);
                        }}
                        disabled={isSubmitting}
                        showPassword={showPassword}
                        onTogglePassword={handleTogglePassword}
                    />
                )}

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained" fullWidth onClick={() => {
                        void handleSubmit();
                    }}
                        disabled={isSubmitting || !isFormValid}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24}
                                                          color="inherit"/> : intl.formatMessage({id: 'users.common.save'})}
                    </Button>
                    <Button variant="text" fullWidth onClick={onClose} disabled={isSubmitting}
                            sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}>
                        {intl.formatMessage({id: 'users.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}