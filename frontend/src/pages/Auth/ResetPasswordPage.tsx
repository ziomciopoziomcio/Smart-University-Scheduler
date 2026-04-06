import {useState, useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {
    Stack,
    Typography,
    TextField,
    Button,
    Alert,
    InputAdornment,
    IconButton,
    Box,
    CircularProgress
} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import {Visibility, VisibilityOff, Lock, Check, Close} from '@mui/icons-material';
import AuthLayout from '@components/Login/AuthLayout';
import {resetPassword} from '@api/auth';

function ResetPasswordPage() {
    const intl = useIntl();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [pageStatus, setPageStatus] = useState<'verifying' | 'form' | 'success' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState<string | React.ReactNode>('');

    useEffect(() => {
        if (!token || token.length < 10) {
            setPageStatus('error');
            setErrorMsg(<FormattedMessage id="activate.error.invalid"/>);
        } else {
            setPageStatus('form');
        }
    }, [token]);

    const isLongEnough = password.length >= 8;
    const isMatching = password === password2 && password !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLongEnough || !isMatching || !token) return;

        setPageStatus('verifying');
        try {
            await resetPassword({token, password, password2});
            setPageStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setPageStatus('error');
            setErrorMsg(err.message || <FormattedMessage id="activate.error.generic"/>);
        }
    };

    const ValidationRow = ({labelId, isValid}: { labelId: string, isValid: boolean }) => (
        <Stack direction="row" spacing={1} alignItems="center">
            {isValid ? <Check color="success" sx={{fontSize: 16}}/> : <Close color="error" sx={{fontSize: 16}}/>}
            <Typography variant="caption" color={isValid ? "success.main" : "error.main"}>
                <FormattedMessage id={labelId}/>
            </Typography>
        </Stack>
    );

    return (
        <AuthLayout title={<FormattedMessage id="forgotPassword.title"/>}>
            <Stack spacing={3} width="100%" alignItems="center">

                {pageStatus === 'verifying' && (
                    <Stack alignItems="center" spacing={2}>
                        <CircularProgress/>
                        <Typography><FormattedMessage id="activate.loading"/></Typography>
                    </Stack>
                )}

                {pageStatus === 'error' && (
                    <>
                        <Alert severity="error" sx={{width: '100%'}}>{errorMsg}</Alert>
                        <Button variant="contained" onClick={() => navigate('/forgot-password')} fullWidth>
                            <FormattedMessage id="activate.resend"/>
                        </Button>
                    </>
                )}

                {pageStatus === 'success' && (
                    <Alert severity="success" sx={{width: '100%'}}>
                        <FormattedMessage id="login.validation.success"/>
                    </Alert>
                )}

                {pageStatus === 'form' && (
                    <>
                        <Box sx={{width: '100%'}}>
                            <Typography variant="body2" textAlign="center" sx={{mb: 2}}>
                                <FormattedMessage id="forgotPassword.instruction"/>
                            </Typography>
                            <Stack spacing={0.5} sx={{mb: 2}}>
                                <ValidationRow labelId="register.validation.length" isValid={isLongEnough}/>
                                <ValidationRow labelId="register.validation.match" isValid={isMatching}/>
                            </Stack>
                        </Box>

                        <form onSubmit={handleSubmit} style={{width: '100%'}}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    label={intl.formatMessage({id: 'forgotPassword.newPassword'})}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock/></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff/> : <Visibility/>}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    label={intl.formatMessage({id: 'forgotPassword.confirmNewPassword'})}
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock/></InputAdornment>,
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    type="submit"
                                    disabled={!isLongEnough || !isMatching}
                                    sx={{mt: 2, backgroundColor: '#004d71'}}
                                >
                                    <FormattedMessage id="forgotPassword.submitNew"/>
                                </Button>
                            </Stack>
                        </form>
                    </>
                )}

                <Button onClick={() => navigate('/login')} sx={{textTransform: 'none'}}>
                    <FormattedMessage id="register.backToLogin"/>
                </Button>
            </Stack>
        </AuthLayout>
    );
}

export default ResetPasswordPage;