import {useEffect, useState, useRef} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {CircularProgress, Alert, Stack, Typography, Button} from '@mui/material';
import {FormattedMessage} from 'react-intl';
import AuthLayout from '@components/Login/AuthLayout';
import {verifyEmail} from '@api';

function ActivationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState<string | React.ReactNode>('');

    const activationStarted = useRef(false);
    const token = searchParams.get('token');

    useEffect(() => {
        const performActivation = async () => {
            if (!token) {
                setStatus('error');
                setErrorMsg(<FormattedMessage id="activate.error.incomplete"/>);
                return;
            }

            if (activationStarted.current) return;
            activationStarted.current = true;

            try {
                await verifyEmail(token);
                setStatus('success');
            } catch (err: any) {
                setStatus('error');
                setErrorMsg(err.message || <FormattedMessage id="activate.error.invalidOrExpired"/>);
            }
        };

        performActivation();
    }, [token]);

    return (
        <AuthLayout title={<FormattedMessage id="activate.title"/>}>
            <Stack spacing={3} alignItems="center" width="100%">
                {status === 'loading' && (
                    <Stack alignItems="center" spacing={2}>
                        <CircularProgress/>
                        <Typography>
                            <FormattedMessage id="activate.loading"/>
                        </Typography>
                    </Stack>
                )}

                {status === 'success' && (
                    <>
                        <Alert severity="success" sx={{width: '100%'}}>
                            <FormattedMessage id="activate.success"/>
                        </Alert>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => navigate('/login')}
                        >
                            <FormattedMessage id="activate.goToLogin"/>
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <Alert severity="error" sx={{width: '100%'}}>
                            {errorMsg}
                        </Alert>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate('/login')}
                        >
                            <FormattedMessage id="activate.backToLogin"/>
                        </Button>
                    </>
                )}
            </Stack>
        </AuthLayout>
    );
}

export default ActivationPage;