import {useState, useEffect} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Alert,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import {CheckCircleOutline, ContentCopy, HelpOutline} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useAuthStore} from '@store/useAuthStore';
import {setup2FA, confirm2FA} from '@api/domains/users/auth';
import {QRCodeSVG} from 'qrcode.react';
import {OtpInput} from '@components/Login/OtpInput';
import {AppButton} from '@components/Common';
import {useTheme} from '@mui/material/styles';

interface TwoFactorSetupModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function TwoFactorSetupModal({open, onClose, onSuccess, onError}: TwoFactorSetupModalProps) {
    const intl = useIntl();
    const {token, finalizeLogin} = useAuthStore();
    const theme = useTheme();

    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState<{ qr: string, secret: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

    useEffect(() => {
        if (open && token && !setupData && !backupCodes) {
            void handleEnable2FA();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, token]);

    const handleEnable2FA = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await setup2FA(token);
            setSetupData({qr: data.provisioning_uri, secret: data.secret});
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Error setting up 2FA');
            handleClose();
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm2FA = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await confirm2FA(token, verificationCode);
            setBackupCodes(data.backup_codes);
            await finalizeLogin(token); // Refresh user data
            onSuccess(intl.formatMessage({id: 'settings.security.twoFactor.successEnabled'}));
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Error confirming 2FA');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        if (backupCodes) {
            navigator.clipboard.writeText(backupCodes.join('\n')).catch(() => { /* ignore */ });
            onSuccess(intl.formatMessage({id: 'users.modal.copySuccess'}));
        }
    };

    const copySecret = () => {
        if (setupData?.secret) {
            navigator.clipboard.writeText(setupData.secret).catch(() => { /* ignore */ });
            onSuccess(intl.formatMessage({id: 'users.modal.copySuccess'}));
        }
    };

    const handleClose = () => {
        if (loading) return;
        setBackupCodes(null);
        setVerificationCode('');
        setSetupData(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={() => {
                if (!backupCodes) handleClose();
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    minHeight: '450px'
                }
            }}
        >
            <DialogTitle sx={{color: 'text.primary', fontWeight: 700, pb: 1, textAlign: 'center'}}>
                {intl.formatMessage({id: 'settings.security.twoFactor.setupTitle'})}
            </DialogTitle>
            <DialogContent sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                mt: 1,
                alignItems: 'center',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                    display: 'none'
                },
                msOverflowStyle: 'none'
            }}>
                {!backupCodes ? (
                    <>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            {intl.formatMessage({id: 'settings.security.twoFactor.setupDesc'})}
                        </Typography>
                        {setupData && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                                width: '100%'
                            }}>
                                <Box sx={{
                                    p: 2,
                                    bgcolor: '#ffffff', // Keep white for QR code readability
                                    borderRadius: '12px',
                                    border: 1,
                                    borderColor: 'divider',
                                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <QRCodeSVG value={setupData.qr} size={180}/>
                                </Box>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        bgcolor: 'background.default',
                                        px: 2,
                                        py: 1,
                                        borderRadius: '8px',
                                        border: 1,
                                        borderStyle: 'dashed',
                                        borderColor: 'divider'
                                    }}>
                                        <Typography color="text.primary" sx={{
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                            letterSpacing: '1px'
                                        }}>
                                            {setupData.secret}
                                        </Typography>
                                        <Tooltip title={intl.formatMessage({id: 'users.modal.copyTooltip'})}>
                                            <IconButton size="small" onClick={copySecret}>
                                                <ContentCopy fontSize="small" sx={{color: 'text.secondary'}}/>
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Tooltip title={intl.formatMessage({id: 'settings.security.twoFactor.manualEntry'})}>
                                        <HelpOutline sx={{fontSize: '1.4rem', color: 'text.secondary', cursor: 'help'}}/>
                                    </Tooltip>
                                </Box>
                            </Box>
                        )}
                        <Box sx={{width: '100%', mt: 1}}>
                            <Typography variant="caption" color="text.primary" sx={{display: 'block', mb: 1, textAlign: 'center', fontWeight: 600}}>
                                {intl.formatMessage({id: 'settings.security.twoFactor.confirmCode'})}
                            </Typography>
                            <OtpInput
                                value={verificationCode}
                                onChange={setVerificationCode}
                                disabled={loading}
                            />
                        </Box>
                    </>
                ) : (
                    <Box sx={{width: '100%'}}>
                        <Alert severity="success" icon={<CheckCircleOutline/>} sx={{mb: 3}}>
                            {intl.formatMessage({id: 'settings.security.twoFactor.successEnabled'})}
                        </Alert>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={700} gutterBottom>
                            {intl.formatMessage({id: 'settings.security.twoFactor.backupCodesTitle'})}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            {intl.formatMessage({id: 'settings.security.twoFactor.backupCodesDesc'})}
                        </Typography>
                        <Paper variant="outlined" sx={{p: 2, bgcolor: 'background.default', position: 'relative', borderColor: 'divider'}}>
                            <IconButton
                                size="small"
                                onClick={copyBackupCodes}
                                sx={{position: 'absolute', top: 8, right: 8}}
                            >
                                <ContentCopy fontSize="small" sx={{color: 'text.secondary'}}/>
                            </IconButton>
                            <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1}}>
                                {backupCodes.map((code) => (
                                    <Typography key={code} color="text.primary" sx={{fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600}}>
                                        {code}
                                    </Typography>
                                ))}
                            </Box>
                        </Paper>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{p: 3}}>
                {!backupCodes ? (
                    <>
                        <AppButton variant="text" onClick={handleClose} disabled={loading}>
                            {intl.formatMessage({id: 'common.cancel'})}
                        </AppButton>
                        <AppButton
                            variant="contained"
                            onClick={() => { void handleConfirm2FA(); }}
                            disabled={verificationCode.length !== 6 || !setupData}
                            loading={loading}
                        >
                            {intl.formatMessage({id: 'common.save'})}
                        </AppButton>
                    </>
                ) : (
                    <AppButton variant="contained" onClick={handleClose}>
                        {intl.formatMessage({id: 'schedule.details.close'})}
                    </AppButton>
                )}
            </DialogActions>
        </Dialog>
    );
}
