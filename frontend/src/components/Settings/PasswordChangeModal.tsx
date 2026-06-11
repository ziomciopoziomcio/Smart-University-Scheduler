import {useState} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {useIntl} from 'react-intl';
import {useAuthStore} from '@store/useAuthStore';
import {changePassword} from '@api/domains/users/auth';
import {AppButton} from '@components/Common';

interface PasswordChangeModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function PasswordChangeModal({open, onClose, onSuccess, onError}: PasswordChangeModalProps) {
    const intl = useIntl();
    const {token} = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handlePasswordChange = async () => {
        if (!token) return;
        if (newPassword !== confirmNewPassword) {
            onError(intl.formatMessage({id: 'users.errors.passwordMismatch'}));
            return;
        }

        setLoading(true);
        try {
            await changePassword(token, oldPassword, newPassword, confirmNewPassword);
            onSuccess(intl.formatMessage({id: 'settings.security.password.success'}));
            handleClose();
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Error changing password');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{color: 'text.primary', fontWeight: 700, textAlign: 'center'}}>
                {intl.formatMessage({id: 'settings.security.password.title'})}
            </DialogTitle>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                <TextField
                    label={intl.formatMessage({id: 'settings.security.password.oldPassword'})}
                    type="password"
                    fullWidth
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    label={intl.formatMessage({id: 'settings.security.password.newPassword'})}
                    type="password"
                    fullWidth
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    label={intl.formatMessage({id: 'settings.security.password.confirmPassword'})}
                    type="password"
                    fullWidth
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={loading}
                />
            </DialogContent>
            <DialogActions sx={{p: 3}}>
                <AppButton variant="text" onClick={handleClose} disabled={loading}>
                    {intl.formatMessage({id: 'common.cancel'})}
                </AppButton>
                <AppButton
                    variant="contained"
                    onClick={() => { void handlePasswordChange(); }}
                    disabled={!oldPassword || !newPassword || !confirmNewPassword}
                    loading={loading}
                    sx={{width: '120px'}}
                >
                    {intl.formatMessage({id: 'common.save'})}
                </AppButton>
            </DialogActions>
        </Dialog>
    );
}
