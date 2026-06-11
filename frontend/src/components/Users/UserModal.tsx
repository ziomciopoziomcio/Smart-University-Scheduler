import {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    Button,
    TextField,
    Tooltip,
    FormControlLabel,
    Checkbox,
    IconButton,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {Autorenew, ContentCopy} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {type User, createUser, updateUser} from '@api';
import AuthPasswordField from '@components/Login/AuthPasswordField';
import {AppButton} from '@components/Common';

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
    const [forceChange, setForceChange] = useState(true);
    const [sendEmail, setSendEmail] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

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
                setPassword('');
                setSendEmail(false);
                setForceChange(true);
                setShowPassword(false);
            }
        }
    }, [open, user]);

    const handleGeneratePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        const randomValues = new Uint32Array(12);
        crypto.getRandomValues(randomValues);
        let retVal = "";
        for (let i = 0; i < 12; i++) {
            retVal += charset[randomValues[i] % charset.length];
        }
        setPassword(retVal);
        setShowPassword(true);
        navigator.clipboard.writeText(retVal)
            .then(() => {
                setSnackbarOpen(true);
            })
            .catch((err: unknown) => console.error("Nie udało się skopiować hasła", err));
    };

    const handleCopyPassword = () => {
        if (password) {
            void navigator.clipboard.writeText(password);
            setSnackbarOpen(true);
        }
    };

    const isFormValid = isEditMode
        ? email.includes('@') && name && surname
        : email.includes('@') && name && surname && password.length >= 8;

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);
        try {
            const payload: any = {
                email, name, surname,
                phone_number: phone || null,
                degree: degree || null
            };

            if (isEditMode && user) {
                await updateUser(user.id, payload);
            } else {
                payload.password = password;
                payload.password2 = password;

                // TODO: Backend needs to handle these flags:
                // payload.force_password_change = forceChange;
                // payload.send_credentials_email = sendEmail;

                await createUser(payload);
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
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                    PaperProps={{sx: {borderRadius: '20px', p: 1}}}>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2.5, pt: 4}}>
                    <Typography variant="h5" fontWeight={700} sx={{mb: 1, textAlign: 'center'}}>
                        {isEditMode ? intl.formatMessage({id: 'users.view.edit'}) : intl.formatMessage({id: 'users.view.add'})}
                    </Typography>

                    <TextField label={intl.formatMessage({id: 'users.modal.emailLabel'})}
                               value={email}
                               onChange={(e) => {
                                   setEmail(e.target.value);
                               }}
                               fullWidth
                               disabled={isSubmitting}
                    />
                    <TextField label={intl.formatMessage({id: 'users.modal.nameLabel'})}
                               value={name}
                               onChange={(e) => {
                                   setName(e.target.value);
                               }}
                               fullWidth
                               disabled={isSubmitting}
                    />
                    <TextField label={intl.formatMessage({id: 'users.modal.surnameLabel'})}
                               value={surname}
                               onChange={(e) => {
                                   setSurname(e.target.value);
                               }}
                               fullWidth
                               disabled={isSubmitting}
                    />

                    <Box sx={{display: 'flex', gap: 2}}>
                        <FormControl fullWidth disabled={isSubmitting}>
                            <InputLabel id="degree-select-label">
                                {intl.formatMessage({id: 'users.modal.degreeLabel'})}
                            </InputLabel>
                            <Select
                                labelId="degree-select-label"
                                value={degree}
                                label={intl.formatMessage({id: 'users.modal.degreeLabel'})}
                                onChange={(e) => {
                                    setDegree(e.target.value as string);
                                }}
                            >
                                <MenuItem value="">
                                    <em>{intl.formatMessage({
                                        id: 'users.modal.degreeNone',
                                        defaultMessage: 'Brak'
                                    })}</em>
                                </MenuItem>
                                <MenuItem value="inz">inż.</MenuItem>
                                <MenuItem value="mgr">mgr</MenuItem>
                                <MenuItem value="dr">dr</MenuItem>
                                <MenuItem value="dr_hab">dr hab.</MenuItem>
                                <MenuItem value="prof">prof.</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField label={intl.formatMessage({id: 'users.modal.phoneLabel'})}
                                   value={phone}
                                   onChange={(e) => {
                                       setPhone(e.target.value);
                                   }}
                                   fullWidth disabled={isSubmitting}/>
                    </Box>

                    {!isEditMode ? (
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                            <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start'}}>
                                <Box sx={{flexGrow: 1}}>
                                    <AuthPasswordField
                                        label={intl.formatMessage({id: 'users.modal.initialPassword'})}
                                        placeholder="#####"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                        }}
                                        disabled={isSubmitting}
                                        showPassword={showPassword}
                                        onTogglePassword={() => {
                                            setShowPassword(!showPassword);
                                        }}
                                    />
                                </Box>
                                <Tooltip title={intl.formatMessage({id: 'users.modal.copyTooltip'})}>
                                    <span>
                                        <IconButton
                                            onClick={handleCopyPassword}
                                            disabled={!password}
                                            sx={{height: 56, width: 56, borderRadius: '12px', border: '1px solid #ddd'}}
                                        >
                                            <ContentCopy/>
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title={intl.formatMessage({id: 'users.modal.generate'})}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleGeneratePassword}
                                        sx={{height: 56, minWidth: 56, borderRadius: '12px'}}
                                    >
                                        <Autorenew/>
                                    </Button>
                                </Tooltip>
                            </Box>

                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={forceChange}
                                            onChange={(e) => {
                                                setForceChange(e.target.checked);
                                            }}/>}
                                    label={<Typography
                                        variant="body2">{intl.formatMessage({id: 'users.modal.forceChangeLabel'})}</Typography>}
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={sendEmail}
                                                       onChange={(e) => setSendEmail(e.target.checked)}
                                                       color="primary"/>}
                                    label={<Typography variant="body2"
                                                       fontWeight={500}>{intl.formatMessage({id: 'users.modal.sendEmailLabel'})}</Typography>}
                                />
                            </Box>
                        </Box>
                    ) : (
                        // TODO: FIX RESET PASSWORD LINK
                        <AppButton variant="outlined"
                                   sx={{mt: 1, alignSelf: 'flex-start', textTransform: 'none', width: '100%'}}>
                            {intl.formatMessage({id: 'users.modal.sendResetLink'})}
                        </AppButton>
                    )}

                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                        <AppButton variant="contained" onClick={handleSubmit} loading={isSubmitting}
                                   disabled={isSubmitting || !isFormValid}>
                            {intl.formatMessage({id: 'users.common.save'})}
                        </AppButton>
                        <AppButton variant="text" onClick={onClose} disabled={isSubmitting}>
                            {intl.formatMessage({id: 'users.common.cancel'})}
                        </AppButton>
                    </Box>
                </DialogContent>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => {
                setSnackbarOpen(false);
            }}>
                <Alert severity="success" sx={{width: '100%'}}>
                    {intl.formatMessage({id: 'users.modal.passwordCopied'})}
                </Alert>
            </Snackbar>
        </>
    );
}