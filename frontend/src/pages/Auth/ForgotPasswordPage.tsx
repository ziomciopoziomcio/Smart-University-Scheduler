import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Stack, Typography, TextField, Button, Alert, InputAdornment} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AuthLayout from '@components/Login/AuthLayout';
import {forgotPassword} from '@api/auth';
import {Email} from "@mui/icons-material";

function ForgotPasswordPage() {
    const intl = useIntl();
    const navigate = useNavigate();

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
                    <FormattedMessage id="activate.description"/>
                </Typography>

                {status === 'success' ? (
                    <Alert severity="success" sx={{width: '100%'}}>
                        <FormattedMessage id="forgotPassword.successMailSent"/>
                    </Alert>
                ) : (
                    <form onSubmit={handleSubmit} style={{width: '100%'}}>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label={intl.formatMessage({id: 'login.username'})}
                                placeholder={intl.formatMessage({id: 'login.usernamePlaceholder'})}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                type="email"
                                slotProps={{
                                    input: {
                                        sx: { fontSize: (theme) => theme.fontSizes.small },
                                        startAdornment: !email ? (
                                            <InputAdornment position="start">
                                                <Email sx={{ fontSize: (theme) => theme.iconSizes.textFieldDecorator }} />
                                            </InputAdornment>
                                        ) : null,
                                    },
                                    inputLabel: {
                                        sx: { fontSize: (theme) => theme.fontSizes.small }
                                    }
                                }}
                            />

                            {status === 'error' && (
                                <Alert severity="error">{errorMsg}</Alert>
                            )}

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                type="submit"
                                disabled={status === 'loading'}
                                sx={{backgroundColor: '#004d71', '&:hover': {backgroundColor: '#003a55'}}}
                            >
                                <FormattedMessage id="forgotPassword.sendResetLink"/>
                            </Button>
                        </Stack>
                    </form>
                )}

                <Button
                    startIcon={<ArrowBackIcon/>}
                    onClick={() => navigate('/login')}
                    sx={{textTransform: 'none', color: '#004d71'}}
                >
                    <FormattedMessage id="register.backToLogin"/>
                </Button>
            </Stack>
        </AuthLayout>
    );
}

export default ForgotPasswordPage;