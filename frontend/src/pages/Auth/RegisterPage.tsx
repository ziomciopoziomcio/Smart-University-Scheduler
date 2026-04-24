import {useState} from 'react';
import {Button, Stack, TextField, Alert, CircularProgress, Typography, Link, Box, MenuItem} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {useNavigate} from 'react-router-dom';

import {AuthLayout, AuthPasswordField} from '@components/Login';
import {registerUser} from '@api';

const DEGREES = [
    {value: 'none', id: 'register.degrees.none'},
    {value: 'inz', id: 'register.degrees.inz'},
    {value: 'mgr', id: 'register.degrees.mgr'},
    {value: 'dr', id: 'register.degrees.dr'},
    {value: 'dr_hab', id: 'register.degrees.dr_hab'},
    {value: 'prof', id: 'register.degrees.prof'},
];

function RegisterPage() {
    const intl = useIntl();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [degree, setDegree] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (password !== confirmPassword) {
            setError(intl.formatMessage({id: 'register.validation.passwordsDontMatch'}));
            return;
        }

        setLoading(true);

        try {
            await registerUser({
                email,
                password,
                confirmPassword,
                name,
                surname,
                phone_number: phoneNumber,
                degree
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 10000);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || intl.formatMessage({id: 'register.validation.providerError'}));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout title={<FormattedMessage id="register.titleSuccess"/>}>
                <Alert severity="success" sx={{width: '100%', mb: 2}}>
                    <FormattedMessage id="register.successMessage"/>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                    <FormattedMessage id="register.redirectingToLogin"/>
                </Typography>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title={<FormattedMessage id="register.title"/>}>
            <Stack
                component="form"
                spacing={2.5}
                width="100%"
                onSubmit={handleSubmit}
            >
                {error && <Alert severity="error">{error}</Alert>}

                <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                    <TextField
                        label={intl.formatMessage({id: 'register.name'})}
                        placeholder={intl.formatMessage({id: 'register.namePlaceholder'})}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
                        fullWidth
                    />
                    <TextField
                        label={intl.formatMessage({id: 'register.surname'})}
                        placeholder={intl.formatMessage({id: 'register.surnamePlaceholder'})}
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        disabled={loading}
                        required
                        fullWidth
                    />
                </Stack>

                <TextField
                    select
                    label={intl.formatMessage({id: 'register.degree'})}
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    disabled={loading}
                    required
                    fullWidth
                >
                    {DEGREES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {intl.formatMessage({id: option.id})}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label={intl.formatMessage({id: 'register.phone'})}
                    placeholder="123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    type="tel"
                    required
                    fullWidth
                />

                <TextField
                    label={intl.formatMessage({id: 'login.username'})}
                    placeholder={intl.formatMessage({id: 'login.usernamePlaceholder'})}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    type="email"
                    required
                    fullWidth
                />

                <AuthPasswordField
                    label={intl.formatMessage({id: 'login.password'})}
                    placeholder={intl.formatMessage({id: 'login.passwordPlaceholder'})}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                />

                <AuthPasswordField
                    label={intl.formatMessage({id: 'register.confirmPassword'})}
                    placeholder={intl.formatMessage({id: 'register.confirmPasswordPlaceholder'})}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    showPassword={showConfirmPassword}
                    onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={loading}
                />

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} color="inherit"/>}
                    sx={{mt: 1}}
                >
                    {loading ? 'Tworzenie...' : intl.formatMessage({id: 'register.submit'})}
                </Button>

                <Box sx={{display: 'flex', justifyContent: 'center', mt: 2}}>
                    <Link
                        component="button"
                        type="button"
                        variant="body2"
                        onClick={() => navigate('/login')}
                        disabled={loading}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'text.secondary',
                            gap: 0.5,
                            '&:hover': {color: 'primary.main'}
                        }}
                    >
                        <ArrowBackIcon fontSize="small"/>
                        <FormattedMessage id="register.backToLogin"/>
                    </Link>
                </Box>
            </Stack>
        </AuthLayout>
    );
}

export default RegisterPage;