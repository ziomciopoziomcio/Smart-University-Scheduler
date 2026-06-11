import {useState} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField
} from '@mui/material';
import {useIntl} from 'react-intl';
import {useAuthStore} from '@store/useAuthStore';
import {disable2FA} from '@api/domains/users/auth';
import {OtpInput} from '@components/Login/OtpInput';
import {AppButton} from '@components/Common';

interface TwoFactorDisableModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function TwoFactorDisableModal({open, onClose, onSuccess, onError}: TwoFactorDisableModalProps) {
    const intl = useIntl();
    const {token, finalizeLogin} = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [disableCode, setDisableCode] = useState('');

    const handleDisable2FA = async () => {
        if (!token) return;
        setLoading(true);
        try {
            await disable2FA(token, disablePassword, disableCode);
            await finalizeLogin(token); // Refresh user data
            onSuccess(intl.formatMessage({id: 'settings.security.twoFactor.successDisabled'}));
            handleClose();
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Error disabling 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setDisablePassword('');
        setDisableCode('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{color: 'text.primary', fontWeight: 700, textAlign: 'center'}}>
                {intl.formatMessage({id: 'settings.security.twoFactor.disableTitle'})}
            </DialogTitle>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1, alignItems: 'center'}}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    {intl.formatMessage({id: 'settings.security.twoFactor.disableDesc'})}
                </Typography>
                <TextField
                    label={intl.formatMessage({id: 'settings.security.twoFactor.passwordLabel'})}
                    type="password"
                    fullWidth
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    disabled={loading}
                />
                <Box sx={{mt: 1, width: '100%'}}>
                    <Typography variant="caption" color="text.primary" sx={{display: 'block', mb: 1, fontWeight: 600, textAlign: 'center'}}>
                        {intl.formatMessage({id: 'settings.security.twoFactor.codeLabel'})}
                    </Typography>
                    <OtpInput
                        value={disableCode}
                        onChange={setDisableCode}
                        disabled={loading}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{p: 3}}>
                <AppButton variant="text" onClick={handleClose} disabled={loading}>
                    {intl.formatMessage({id: 'common.cancel'})}
                </AppButton>
                <AppButton
                    variant="contained"
                    color="error"
                    onClick={() => { void handleDisable2FA(); }}
                    disabled={!disablePassword || disableCode.length !== 6}
                    loading={loading}
                    sx={{bgcolor: 'error.main', '&:hover': {bgcolor: 'error.dark'}, color: 'error.contrastText'}}
                >
                    {intl.formatMessage({id: 'settings.security.twoFactor.disable'})}
                </AppButton>
            </DialogActions>
        </Dialog>
    );
}
