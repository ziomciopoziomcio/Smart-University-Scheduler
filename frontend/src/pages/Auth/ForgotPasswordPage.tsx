import {useState} from 'react';
import {Stack, Typography, Button, Alert, CircularProgress} from '@mui/material';
import {FormattedMessage} from 'react-intl';
import AuthLayout from '@components/Login/AuthLayout';
import {forgotPassword} from '@api/auth';
import EmailInput from "@components/Login/EmailInput.tsx";
import BackToLoginButton from "@components/Login/BackToLoginButton.tsx";

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | React.ReactNode>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            await forgotPassword(email);
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || <FormattedMessage id="forgotPassword.errorSending"/>);
        }
    };

    return (
        <AuthLayout title={<FormattedMessage id="login.forgotPassword"/>}>
            <Stack spacing={3} alignItems="center" width="100%">
                <Typography variant="body2" textAlign="center" color="text.secondary">
                    <FormattedMessage id="forgotPassword.description"/>
                </Typography>

                {status === 'success' ? (
                    <Alert severity="success" sx={{width: '100%'}}>
                        <FormattedMessage id="forgotPassword.successMailSent"/>
                    </Alert>
                ) : (
                    <form onSubmit={handleSubmit} style={{width: '100%'}}>
                        <Stack spacing={3}>
                            <EmailInput
                                value={email}
                                onChange={setEmail}
                                disabled={status === 'loading'}
                            />

                            {status === 'error' && (
                                <Alert severity="error">{errorMsg}</Alert>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={status === 'loading'}
                                startIcon={status === 'loading' && <CircularProgress size={20} color="inherit"/>}
                            >
                                {status === 'loading'
                                    ? <FormattedMessage id="forgotPassword.sending" defaultMessage="Wysyłanie..."/>
                                    : <FormattedMessage id="forgotPassword.sendResetLink"/>
                                }
                            </Button>

                        </Stack>
                    </form>
                )}

                <BackToLoginButton disabled={status === 'loading'} />
            </Stack>
        </AuthLayout>
    );
}

export default ForgotPasswordPage;