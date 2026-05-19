import {useState} from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Collapse,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip
} from '@mui/material';
import {
    ExpandMore,
    LockOutlined,
    SecurityOutlined,
    CheckCircleOutline,
    ContentCopy,
    HelpOutline
} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useAuthStore} from '@store/useAuthStore';
import {setup2FA, confirm2FA, disable2FA, changePassword} from '@api/domains/users/auth';
import {QRCodeSVG} from 'qrcode.react';
import {OtpInput} from '@components/Login/OtpInput';

interface SettingsSecurityViewProps {
    search: string;
}

export function SettingsSecurityView({search}: SettingsSecurityViewProps) {
    const intl = useIntl();
    const {token, user, finalizeLogin} = useAuthStore();
    
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 2FA Setup Dialog
    const [setupDialogOpen, setSetupDialogOpen] = useState(false);
    const [setupData, setSetupData] = useState<{qr: string, secret: string} | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

    // 2FA Disable Dialog
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [disableCode, setDisableCode] = useState('');

    // Password Change Dialog
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const toggleGroup = (groupName: string) => {
        const next = new Set(collapsedGroups);
        if (next.has(groupName)) next.delete(groupName);
        else next.add(groupName);
        setCollapsedGroups(next);
    };

    const handlePasswordChange = async () => {
        if (!token) return;
        if (newPassword !== confirmNewPassword) {
            setError(intl.formatMessage({id: 'users.errors.passwordMismatch'}));
            return;
        }

        setLoading(true);
        try {
            await changePassword(token, oldPassword, newPassword, confirmNewPassword);
            setShowSuccess(intl.formatMessage({id: 'settings.security.password.success'}));
            setPasswordDialogOpen(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error changing password');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await setup2FA(token);
            setSetupData({qr: data.provisioning_uri, secret: data.secret});
            setSetupDialogOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error setting up 2FA');
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
            setShowSuccess(intl.formatMessage({id: 'settings.security.twoFactor.successEnabled'}));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error confirming 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!token) return;
        setLoading(true);
        try {
            await disable2FA(token, disablePassword, disableCode);
            await finalizeLogin(token); // Refresh user data
            setShowSuccess(intl.formatMessage({id: 'settings.security.twoFactor.successDisabled'}));
            setDisableDialogOpen(false);
            setDisablePassword('');
            setDisableCode('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error disabling 2FA');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        if (backupCodes) {
            navigator.clipboard.writeText(backupCodes.join('\n')).catch(() => {});
            setShowSuccess(intl.formatMessage({id: 'users.modal.copySuccess'}));
        }
    };

    const copySecret = () => {
        if (setupData?.secret) {
            navigator.clipboard.writeText(setupData.secret).catch(() => {});
            setShowSuccess(intl.formatMessage({id: 'users.modal.copySuccess'}));
        }
    };

    const securityGroupTitle = intl.formatMessage({id: 'settings.security.title'});
    
    const securityItems = [
        {
            id: 'password',
            name: intl.formatMessage({id: 'settings.security.password.name'}),
            description: intl.formatMessage({id: 'settings.security.password.description'}),
            action: (
                <Button 
                    variant="outlined" 
                    onClick={() => setPasswordDialogOpen(true)}
                    startIcon={<LockOutlined />}
                    sx={{borderRadius: '8px', width: '200px'}}
                >
                    {intl.formatMessage({id: 'settings.security.password.changeButton'})}
                </Button>
            )
        },
        {
            id: '2fa',
            name: intl.formatMessage({id: 'settings.security.twoFactor.name'}),
            description: intl.formatMessage({id: 'settings.security.twoFactor.description'}),
            action: user?.two_factor_enabled ? (
                <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={() => setDisableDialogOpen(true)}
                    sx={{borderRadius: '8px', width: '200px'}}
                >
                    {intl.formatMessage({id: 'settings.security.twoFactor.disable'})}
                </Button>
            ) : (
                <Button 
                    variant="contained" 
                    onClick={handleEnable2FA}
                    startIcon={<SecurityOutlined />}
                    sx={{borderRadius: '8px', bgcolor: '#2b5073', width: '200px'}}
                >
                    {intl.formatMessage({id: 'settings.security.twoFactor.setup'})}
                </Button>
            )
        }
    ].filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 4, width: '100%', pb: 10}}>
            {securityItems.length > 0 && (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                    <Paper
                        elevation={0}
                        onClick={() => toggleGroup(securityGroupTitle)}
                        sx={{
                            px: 3,
                            py: 1.5,
                            bgcolor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            '&:hover': {bgcolor: '#f8fafc'}
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={700} sx={{color: '#000000', textTransform: 'uppercase', letterSpacing: 1.2}}>
                            {securityGroupTitle}
                        </Typography>
                        <IconButton size="small" sx={{transform: collapsedGroups.has(securityGroupTitle) ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.3s'}}>
                            <ExpandMore />
                        </IconButton>
                    </Paper>

                    <Collapse in={!collapsedGroups.has(securityGroupTitle)}>
                        <Paper elevation={0} sx={{borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: '#ffffff'}}>
                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                {securityItems.map((item, index) => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(250px, 300px) 1fr auto',
                                            alignItems: 'center',
                                            gap: 4,
                                            py: 2.5,
                                            px: 3,
                                            borderBottom: index !== securityItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                                            '&:hover': {bgcolor: '#f8fafc'}
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={600} color="#1e293b" sx={{textAlign: 'left'}}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="body2" color="#64748b" sx={{textAlign: 'left'}}>
                                            {item.description}
                                        </Typography>
                                        <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                            {item.action}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Collapse>
                </Box>
            )}

            {/* Password Change Dialog */}
            <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{color: 'black', fontWeight: 700}}>
                    {intl.formatMessage({id: 'settings.security.password.title'})}
                </DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField
                        label={intl.formatMessage({id: 'settings.security.password.oldPassword'})}
                        type="password"
                        fullWidth
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <TextField
                        label={intl.formatMessage({id: 'settings.security.password.newPassword'})}
                        type="password"
                        fullWidth
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <TextField
                        label={intl.formatMessage({id: 'settings.security.password.confirmPassword'})}
                        type="password"
                        fullWidth
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{p: 3}}>
                    <Button onClick={() => setPasswordDialogOpen(false)}>{intl.formatMessage({id: 'common.cancel'})}</Button>
                    <Button 
                        variant="contained" 
                        onClick={handlePasswordChange} 
                        disabled={loading || !oldPassword || !newPassword || !confirmNewPassword}
                        sx={{bgcolor: '#2b5073'}}
                    >
                        {loading ? <CircularProgress size={24} /> : intl.formatMessage({id: 'common.save'})}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={setupDialogOpen} 
                onClose={() => !backupCodes && setSetupDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        minHeight: '450px'
                    }
                }}
            >
                <DialogTitle sx={{color: 'black', fontWeight: 700, pb: 1}}>
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
                            <Typography variant="body2" textAlign="center">
                                {intl.formatMessage({id: 'settings.security.twoFactor.setupDesc'})}
                            </Typography>
                            {setupData && (
                                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%'}}>
                                    <Box sx={{p: 2, bgcolor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
                                        <QRCodeSVG value={setupData.qr} size={180} />
                                    </Box>
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', px: 2, py: 1, borderRadius: '8px', border: '1px dashed #cbd5e1'}}>
                                            <Typography sx={{fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', color: '#334155'}}>
                                                {setupData.secret}
                                            </Typography>
                                            <Tooltip title={intl.formatMessage({id: 'users.modal.copyTooltip'})}>
                                                <IconButton size="small" onClick={copySecret}>
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        <Tooltip title={intl.formatMessage({id: 'settings.security.twoFactor.manualEntry'})}>
                                            <HelpOutline sx={{fontSize: '1.4rem', color: 'text.secondary', cursor: 'help'}} />
                                        </Tooltip>
                                    </Box>
                                </Box>
                            )}
                            <Box sx={{width: '100%', mt: 1}}>
                                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1, textAlign: 'center', fontWeight: 600}}>
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
                            <Alert severity="success" icon={<CheckCircleOutline />} sx={{mb: 3}}>
                                {intl.formatMessage({id: 'settings.security.twoFactor.successEnabled'})}
                            </Alert>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                {intl.formatMessage({id: 'settings.security.twoFactor.backupCodesTitle'})}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                                {intl.formatMessage({id: 'settings.security.twoFactor.backupCodesDesc'})}
                            </Typography>
                            <Paper variant="outlined" sx={{p: 2, bgcolor: '#f8fafc', position: 'relative'}}>
                                <IconButton 
                                    size="small" 
                                    onClick={copyBackupCodes}
                                    sx={{position: 'absolute', top: 8, right: 8}}
                                >
                                    <ContentCopy fontSize="small" />
                                </IconButton>
                                <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1}}>
                                    {backupCodes.map((code) => (
                                        <Typography key={code} sx={{fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600}}>
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
                            <Button onClick={() => setSetupDialogOpen(false)}>{intl.formatMessage({id: 'common.cancel'})}</Button>
                            <Button 
                                variant="contained" 
                                onClick={handleConfirm2FA} 
                                disabled={loading || verificationCode.length !== 6}
                                sx={{bgcolor: '#2b5073'}}
                            >
                                {loading ? <CircularProgress size={24} /> : intl.formatMessage({id: 'common.save'})}
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant="contained" 
                            onClick={() => {
                                setSetupDialogOpen(false);
                                setBackupCodes(null);
                                setVerificationCode('');
                                setSetupData(null);
                            }}
                            sx={{bgcolor: '#2b5073'}}
                        >
                            {intl.formatMessage({id: 'schedule.details.close'})}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* 2FA Disable Dialog */}
            <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{color: 'black', fontWeight: 700}}>
                    {intl.formatMessage({id: 'settings.security.twoFactor.disableTitle'})}
                </DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1, alignItems: 'center'}}>
                    <Typography variant="body2" textAlign="center">
                        {intl.formatMessage({id: 'settings.security.twoFactor.disableDesc'})}
                    </Typography>
                    <TextField
                        label={intl.formatMessage({id: 'settings.security.twoFactor.passwordLabel'})}
                        type="password"
                        fullWidth
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                    />
                    <Box sx={{mt: 1, width: '100%'}}>
                        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1, fontWeight: 600, textAlign: 'center'}}>
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
                    <Button onClick={() => setDisableDialogOpen(false)}>{intl.formatMessage({id: 'common.cancel'})}</Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={handleDisable2FA} 
                        disabled={loading || !disablePassword || disableCode.length !== 6}
                    >
                        {loading ? <CircularProgress size={24} /> : intl.formatMessage({id: 'settings.security.twoFactor.disable'})}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!showSuccess} autoHideDuration={3000} onClose={() => setShowSuccess(null)}>
                <Alert severity="success" variant="filled" sx={{borderRadius: '12px'}}>
                    {showSuccess}
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
                <Alert severity="error" variant="filled" sx={{borderRadius: '12px'}}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
