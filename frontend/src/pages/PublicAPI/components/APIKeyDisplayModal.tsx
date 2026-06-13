import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import {ContentCopy, WarningAmber} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {AppButton} from '@components/Common';
import {useTheme} from '@mui/material/styles';

interface APIKeyDisplayModalProps {
    open: boolean;
    apiKey: string | null;
    onClose: () => void;
}

export default function APIKeyDisplayModal({open, apiKey, onClose}: APIKeyDisplayModalProps) {
    const intl = useIntl();
    const theme = useTheme();

    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey).catch(() => { /* ignore */ });
        }
    };

    return (
        <Dialog
            open={open}
            disableEscapeKeyDown
            onClose={(_, reason) => {
                if (reason !== 'backdropClick') {
                    onClose();
                }
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    p: 1
                }
            }}
        >
            <DialogTitle sx={{fontWeight: 700, textAlign: 'center', pt: 3}}>
                {intl.formatMessage({id: 'publicapi.modal.title'})}
            </DialogTitle>
            <DialogContent sx={{pb: 1}}>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', mt: 1}}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        {intl.formatMessage({id: 'publicapi.modal.description'})}
                    </Typography>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        width: '100%',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                        p: 2,
                        borderRadius: '12px',
                        border: '1px dashed',
                        borderColor: 'divider'
                    }}>
                        <Typography sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            flexGrow: 1,
                            wordBreak: 'break-all',
                            letterSpacing: '0.5px',
                            fontSize: '0.95rem'
                        }}>
                            {apiKey}
                        </Typography>
                        <Tooltip title={intl.formatMessage({id: 'users.modal.copyTooltip'})}>
                            <IconButton onClick={copyToClipboard} color="primary">
                                <ContentCopy fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Alert 
                        severity="warning" 
                        icon={<WarningAmber />}
                        sx={{
                            borderRadius: '12px',
                            width: '100%',
                            '& .MuiAlert-message': {fontWeight: 600}
                        }}
                    >
                        {intl.formatMessage({id: 'publicapi.modal.warning'})}
                    </Alert>
                </Box>
            </DialogContent>
            <DialogActions sx={{p: 3, justifyContent: 'center'}}>
                <AppButton
                    variant="contained"
                    onClick={onClose}
                    sx={{px: 6}}
                >
                    {intl.formatMessage({id: 'schedule.details.close'})}
                </AppButton>
            </DialogActions>
        </Dialog>
    );
}
