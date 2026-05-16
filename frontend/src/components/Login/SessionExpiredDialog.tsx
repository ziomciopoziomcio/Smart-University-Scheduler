import {Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box} from '@mui/material';
import {LockClockOutlined} from '@mui/icons-material';
import {useAuthStore} from '@store/useAuthStore';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';

export default function SessionExpiredDialog() {
    const {sessionExpired, logout} = useAuthStore();
    const intl = useIntl();
    const navigate = useNavigate();

    const handleLogin = () => {
        logout();
        navigate('/login');
    };

    return (
        <Dialog
            open={sessionExpired}
            PaperProps={{
                sx: {borderRadius: '20px', p: 1, textAlign: 'center'}
            }}
        >
            <DialogContent>
                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2}}>
                    <LockClockOutlined sx={{fontSize: 64, color: 'primary.main', opacity: 0.8}}/>
                    <DialogTitle sx={{fontWeight: 700, p: 0, color: "text.primary"}}>
                        {intl.formatMessage({id: 'auth.sessionExpired.title', defaultMessage: 'Sesja wygasła'})}
                    </DialogTitle>
                    <Typography variant="body1" color="text.secondary">
                        {intl.formatMessage({
                            id: 'auth.sessionExpired.message',
                            defaultMessage: 'Twoja sesja dobiegła końca. Zaloguj się ponownie, aby kontynuować pracę.'
                        })}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{justifyContent: 'center', pb: 3, px: 3}}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleLogin}
                    sx={{borderRadius: '12px', py: 1.5, fontWeight: 700}}
                >
                    {intl.formatMessage({id: 'auth.sessionExpired.button', defaultMessage: 'Przejdź do logowania'})}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
