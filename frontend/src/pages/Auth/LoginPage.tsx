import {useState} from 'react';
import {Button, Stack, TextField, Alert, CircularProgress, InputAdornment} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';
import AuthLayout from '@components/Login/AuthLayout';
import AuthPasswordField from '@components/Login/AuthPasswordField';
import {useAuthStore} from '@store/useAuthStore';
import {Email} from "@mui/icons-material";

function LoginPage() {
    const intl = useIntl();
    const navigate = useNavigate();
    const {login, loading, error} = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const executeLogin = async () => {
            try {
                const data = await login(email, password);
                if (data.requires_2fa) {
                    alert(intl.formatMessage({id: 'login.validation.2faRequired'}));
                } else {
                    navigate('/plan', {replace: true});
                }
            } catch (err: any) {
                console.error(err);
            }
        };

        void executeLogin();
    };

    return (
        <AuthLayout title={<FormattedMessage id="login.title"/>}>
            <Stack component="form" spacing={2.5} width="100%" onSubmit={handleSubmit}>
                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}
                <TextField
                    label={intl.formatMessage({id: 'login.email'})}
                    placeholder={intl.formatMessage({id: 'login.emailPlaceholder'})}
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    disabled={loading}
                    required
                    slotProps={{
        input: {
            startAdornment: !email ? (
                <InputAdornment position="start">
                    <Email sx={{ fontSize: (theme) => theme.iconSizes.textFieldDecorator }} />
                </InputAdornment>
            ) : null,
        }
    }}
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
                    {loading
                        ? intl.formatMessage({id: 'login.loggingIn'})
                        : intl.formatMessage({id: 'login.submit'})
                    }
                </Button>

                <Stack direction="row" justifyContent="space-between">
                    <Button variant="text" disabled={loading} onClick={() => navigate('/register')}>
                        <FormattedMessage id="login.createAccount"/>
                    </Button>
                    <Button variant="text" disabled={loading} onClick={() => navigate('/forgot-password')}>
                        <FormattedMessage id="login.forgotPassword"/>
                    </Button>
                </Stack>
            </Stack>
        </AuthLayout>
    );
}

export default LoginPage;