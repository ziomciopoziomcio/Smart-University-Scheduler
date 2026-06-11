import {useState} from 'react';
import {
    Box,
    Typography,
    Paper,
    Snackbar,
    Alert,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    ExpandMore,
    LockOutlined,
    SecurityOutlined,
} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useAuthStore} from '@store/useAuthStore';
import {useTheme} from "@mui/material/styles";
import {AppButton} from '@components/Common';

import {PasswordChangeModal} from './PasswordChangeModal';
import {TwoFactorSetupModal} from './TwoFactorSetupModal';
import {TwoFactorDisableModal} from './TwoFactorDisableModal';

interface SettingsSecurityViewProps {
    search: string;
}

export function SettingsSecurityView({search}: SettingsSecurityViewProps) {
    const intl = useIntl();
    const {user} = useAuthStore();
    const theme = useTheme();

    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [showSuccess, setShowSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Dialogs State
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [setupDialogOpen, setSetupDialogOpen] = useState(false);
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);

    const toggleGroup = (groupName: string) => {
        const next = new Set(collapsedGroups);
        if (next.has(groupName)) next.delete(groupName);
        else next.add(groupName);
        setCollapsedGroups(next);
    };

    const handleSuccess = (message: string) => {
        setShowSuccess(message);
    };

    const handleError = (message: string) => {
        setError(message);
    };

    const securityGroupTitle = intl.formatMessage({id: 'settings.security.title'});

    const securityItems = [
        {
            id: 'password',
            name: intl.formatMessage({id: 'settings.security.password.name'}),
            description: intl.formatMessage({id: 'settings.security.password.description'}),
            action: (
                <AppButton
                    variant="outlined"
                    onClick={() => setPasswordDialogOpen(true)}
                    startIcon={<LockOutlined/>}
                    sx={{width: '240px'}}
                >
                    {intl.formatMessage({id: 'settings.security.password.changeButton'})}
                </AppButton>
            )
        },
        {
            id: '2fa',
            name: intl.formatMessage({id: 'settings.security.twoFactor.name'}),
            description: intl.formatMessage({id: 'settings.security.twoFactor.description'}),
            action: user?.two_factor_enabled ? (
                <AppButton
                    variant="outlined"
                    color="error"
                    onClick={() => setDisableDialogOpen(true)}
                    sx={{width: '240px', borderColor: 'error.main', color: 'error.main', '&:hover': {borderColor: 'error.dark', bgcolor: 'error.light'}}}
                >
                    {intl.formatMessage({id: 'settings.security.twoFactor.disable'})}
                </AppButton>
            ) : (
                <AppButton
                    variant="contained"
                    onClick={() => setSetupDialogOpen(true)}
                    startIcon={<SecurityOutlined/>}
                    sx={{width: '240px'}}
                >
                    {intl.formatMessage({id: 'settings.security.twoFactor.setup'})}
                </AppButton>
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
                            background: theme.palette.background.paper,
                            borderRadius: '16px',
                            border: 1,
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            '&:hover': {
                                background: theme.palette.background.highlight,
                            }
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary"
                                    sx={{textTransform: 'uppercase', letterSpacing: 1.2}}>
                            {securityGroupTitle}
                        </Typography>
                        <IconButton size="small" sx={{
                            transform: collapsedGroups.has(securityGroupTitle) ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                        }}>
                            <ExpandMore/>
                        </IconButton>
                    </Paper>

                    <Collapse in={!collapsedGroups.has(securityGroupTitle)}>
                        <Paper elevation={0} sx={{
                            borderRadius: '16px',
                            border: 1,
                            borderColor: 'divider',
                            overflow: 'hidden',
                        }}>
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
                                            borderBottom: index !== securityItems.length - 1 ? 1 : 0,
                                            borderColor: 'divider',
                                            '&:hover': {
                                                background: theme.palette.background.highlight,
                                            }
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={600} color="text.primary"
                                                    sx={{textAlign: 'left'}}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{textAlign: 'left'}}>
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

            <PasswordChangeModal 
                open={passwordDialogOpen} 
                onClose={() => setPasswordDialogOpen(false)} 
                onSuccess={handleSuccess} 
                onError={handleError} 
            />

            <TwoFactorSetupModal 
                open={setupDialogOpen} 
                onClose={() => setSetupDialogOpen(false)} 
                onSuccess={handleSuccess} 
                onError={handleError} 
            />

            <TwoFactorDisableModal 
                open={disableDialogOpen} 
                onClose={() => setDisableDialogOpen(false)} 
                onSuccess={handleSuccess} 
                onError={handleError} 
            />

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
