import {useState} from 'react';
import {Button, Stack, TextField, Alert, CircularProgress} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';
import AuthLayout from '@components/Login/AuthLayout';
import AuthPasswordField from '@components/Login/AuthPasswordField';
import {loginUser} from '@api/auth';

function LoginPage() {
    const intl = useIntl();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await loginUser(email, password);
            if (data.requires_2fa) {
                alert(<FormattedMessage id="login.validation.2faRequired"/>);
            } else {
                localStorage.setItem('token', data.access_token);
                navigate('/plan', {replace: true});
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message ||
                <FormattedMessage id="login.validation.providerError"/>);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={<FormattedMessage id="login.title"/>}>
            <Stack
                component="form"
                spacing={2.5}
                width="100%"
                onSubmit={handleSubmit}
            >
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label={intl.formatMessage({id: 'login.username'})}
                    placeholder={intl.formatMessage({id: 'login.usernamePlaceholder'})}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    type="email"
                    required
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

                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} color="inherit"/>}
                >
                    {loading ? 'Logowanie...' : intl.formatMessage({id: 'login.submit'})}
                </Button>

                <Stack direction="row" justifyContent="space-between">
                    <Button variant="text" disabled={loading} onClick={() => navigate('/register')}>
                        <FormattedMessage id="login.createAccount"/>
                    </Button>
                    <Button variant="text" disabled={loading}>
                        <FormattedMessage id="login.forgotPassword"/>
                    </Button>
                </Stack>
            </Stack>
        </AuthLayout>
    );
}

export default LoginPage;