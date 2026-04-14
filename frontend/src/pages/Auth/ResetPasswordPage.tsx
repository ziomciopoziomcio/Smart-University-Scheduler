import {useState, useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {
    Stack,
    Typography,
    Button,
    Alert,
    Box,
    CircularProgress,
    LinearProgress,
    Tooltip
} from '@mui/material';
import {Check, Close, InfoOutlined} from '@mui/icons-material';
import {FormattedMessage, useIntl} from 'react-intl';
import AuthLayout from '@components/Login/AuthLayout';
import AuthPasswordField from '@components/Login/AuthPasswordField';
import {resetPassword} from '@api/auth';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function ResetPasswordPage() {
    const intl = useIntl();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState(3);

    const [pageStatus, setPageStatus] = useState<'form' | 'loading' | 'success'>('form');
    const [errorMsg, setErrorMsg] = useState<string | React.ReactNode>('');

    const len = password.length;
    const isMinLength = len >= 8;
    const isMatching = password === password2 && password !== '';

    const strengthValue = Math.min((len / 16) * 100, 100);
    const strengthColor = len < 8 ? 'error' : len < 12 ? 'warning' : 'success';

    useEffect(() => {
        if (!token || token.length < 43) {
            setErrorMsg(intl.formatMessage({ id: 'forgotPassword.errorInvalidToken' }));
        }
    }, [token, intl]);

    useEffect(() => {
        if (pageStatus === 'success' && countdown > 0) {
            const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (pageStatus === 'success' && countdown === 0) {
            navigate('/login');
        }
    }, [pageStatus, countdown, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isMinLength || !isMatching || !token) return;
        setPageStatus('loading');
        try {
            await resetPassword({token, password, password2});
            setPageStatus('success');
        } catch (err: any) {
            setPageStatus('form');
            setErrorMsg(err.message || intl.formatMessage({ id: 'activate.error.generic' }));
        }
    };

    return (
        <AuthLayout title={<FormattedMessage id="forgotPassword.title" />}>
            <Stack spacing={3} width="100%">
                {pageStatus === 'success' ? (
                    <Alert severity="success">
                        <FormattedMessage
                            id="forgotPassword.successRedirect"
                            defaultMessage="Hasło zmienione. Powrót za {countdown}s..."
                            values={{ countdown }}
                        />
                    </Alert>
                ) : (
                    <>
                        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{mb: 1}}>
                                <Typography variant="caption" color="text.secondary">
                                    <FormattedMessage id="forgotPassword.passwordStrength" defaultMessage="Siła hasła" />
                                </Typography>
                                <Tooltip
                                    title={intl.formatMessage({
                                        id: 'forgotPassword.passwordStrengthTooltip',
                                        defaultMessage: 'Wymagane min. 8 znaków. Zalecane 12-16 dla maksymalnego bezpieczeństwa.'
                                    })}
                                    arrow
                                >
                                    <InfoOutlined sx={{fontSize: 14, color: 'text.disabled', cursor: 'pointer'}} />
                                </Tooltip>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={strengthValue}
                                color={strengthColor}
                                sx={{ height: 4, borderRadius: 2, mb: 2 }}
                            />

                            <Stack spacing={0.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {isMinLength ? <Check color="success" sx={{fontSize: 14}}/> : <Close color="error" sx={{fontSize: 14}}/>}
                                    <Typography variant="caption" color={isMinLength ? "success.main" : "error.main"}>
                                        <FormattedMessage id="register.validation.length" />
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {isMatching ? <Check color="success" sx={{fontSize: 14}}/> : <Close color="error" sx={{fontSize: 14}}/>}
                                    <Typography variant="caption" color={isMatching ? "success.main" : "error.main"}>
                                        <FormattedMessage id="register.validation.match" />
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                <AuthPasswordField
                                    label={intl.formatMessage({ id: 'forgotPassword.newPassword' })}
                                    placeholder={intl.formatMessage({ id: 'forgotPassword.newPassword' })}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    showPassword={showPassword}
                                    onTogglePassword={() => setShowPassword(!showPassword)}
                                    disabled={pageStatus === 'loading'}
                                />
                                <AuthPasswordField
                                    label={intl.formatMessage({ id: 'forgotPassword.confirmNewPassword' })}
                                    placeholder={intl.formatMessage({ id: 'forgotPassword.confirmNewPassword' })}
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    showPassword={showPassword}
                                    onTogglePassword={() => setShowPassword(!showPassword)}
                                    disabled={pageStatus === 'loading'}
                                />
                                <Button
                                    variant="contained"
                                    fullWidth
                                    type="submit"
                                    disabled={pageStatus === 'loading' || !isMinLength || !isMatching || !token}
                                    sx={{mt: 1}}
                                >
                                    {pageStatus === 'loading'
                                        ? <CircularProgress size={24}/>
                                        : <FormattedMessage id="forgotPassword.submitNew" />
                                    }
                                </Button>
                                <Button
                                    startIcon={<ArrowBackIcon/>}
                                    onClick={() => navigate('/login')}
                                    sx={{textTransform: 'none', color: '#004d71'}}
                                >
                                    <FormattedMessage id="register.backToLogin"/>
                                </Button>
                            </Stack>
                        </form>
                    </>
                )}
            </Stack>
        </AuthLayout>
    );
}

export default ResetPasswordPage;