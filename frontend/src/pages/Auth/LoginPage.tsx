import {useState} from 'react';
import {Button, Stack, Alert, CircularProgress, Typography} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';
import AuthLayout from '@components/Login/AuthLayout';
import AuthPasswordField from '@components/Login/AuthPasswordField';
import {useAuthStore} from '@store/useAuthStore';
import OtpInput from '@components/Login/OtpInput';
import {verify2FA} from '@api/auth';
import EmailInput from "@components/Login/EmailInput.tsx";
import BackToLoginButton from "@components/Login/BackToLoginButton.tsx";

function LoginPage() {
    const intl = useIntl();
    const navigate = useNavigate();


    const {login, finalizeLogin, loading, error} = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [step, setStep] = useState<'login' | '2fa'>('login');

    const [preToken, setPreToken] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyError, setVerifyError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const executeLogin = async () => {
            try {
                const data = await login(email, password);
                if (data.requires_2fa) {
                    setPreToken(data.access_token);
                    setStep('2fa');
                } else {
                    navigate('/plan', {replace: true});
                }
            } catch {
                console.error(err);
            }
        };

        void executeLogin();
    };

    const handle2FASubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const executeVerify = async () => {
            setVerifyLoading(true);
            setVerifyError('');
            try {
                const data = await verify2FA(totpCode, preToken);
                await finalizeLogin(data.access_token);
                navigate('/plan', {replace: true});
            } catch {
                setVerifyError(err.message || 'Invalid 2FA code');
            } finally {
                setVerifyLoading(false);
            }
        };

        void executeVerify();
    };

    if (step === '2fa') {
        return (
            <AuthLayout
                title={intl.formatMessage({id: 'login.validation.2fa.2faRequired', defaultMessage: 'Weryfikacja 2FA'})}>
                <Typography variant="body2" sx={{mb: 3, textAlign: 'center', color: 'text.secondary'}}>
                    {intl.formatMessage({
                        id: 'login.validation.2fa.2faDescription',
                        defaultMessage: 'Enter code'
                    })}
                </Typography>
                <Stack component="form" spacing={4} width="100%" onSubmit={handle2FASubmit}>
                    {verifyError && <Alert severity="error">{verifyError}</Alert>}

                    <OtpInput
                        value={totpCode}
                        onChange={(newCode) => {
                            setTotpCode(newCode);
                        }}
                        disabled={verifyLoading}
                    />

                    <Stack spacing={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={verifyLoading || totpCode.length !== 6}
                            size="large"
                            startIcon={verifyLoading && <CircularProgress size={20} color="inherit"/>}
                        >
                            {verifyLoading ? 'Sprawdzanie...' : 'Weryfikuj kod'}
                        </Button>
                        <BackToLoginButton disabled={verifyLoading} onClick={() => {
                            setStep('login');
                        }}/>
                    </Stack>
                </Stack>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title={<FormattedMessage id="login.title"/>}>
            <Stack component="form" spacing={2.5} width="100%" onSubmit={handleSubmit}>
                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}

                <EmailInput
                    value={email}
                    onChange={setEmail}
                    disabled={loading}
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
                    <Button variant="text" disabled={true} onClick={() => {
                        navigate('/register');
                    }}>
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