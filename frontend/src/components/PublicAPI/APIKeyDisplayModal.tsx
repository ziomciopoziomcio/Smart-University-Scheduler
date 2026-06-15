import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Alert,
} from '@mui/material';
import {WarningAmber} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {AppButton} from '@components/Common';
import {APIKeyBox} from './APIKeyBox';

interface APIKeyDisplayModalProps {
    open: boolean;
    apiKey: string | null;
    onClose: () => void;
}

export default function APIKeyDisplayModal({open, apiKey, onClose}: APIKeyDisplayModalProps) {
    const intl = useIntl();
    const handleClose = (_: unknown, reason: string) => reason !== 'backdropClick' && onClose();

    return (
        <Dialog open={open} disableEscapeKeyDown onClose={handleClose} maxWidth="sm" fullWidth
            PaperProps={{sx: {borderRadius: '24px', p: 1}}}>
            <DialogTitle sx={{fontWeight: 700, textAlign: 'center', pt: 3}}>
                {intl.formatMessage({id: 'publicapi.modal.title'})}
            </DialogTitle>
            <DialogContent sx={{pb: 1}}>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', mt: 1}}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        {intl.formatMessage({id: 'publicapi.modal.description'})}
                    </Typography>
                    <APIKeyBox apiKey={apiKey}/>
                    <Alert severity="warning" icon={<WarningAmber/>} sx={{borderRadius: '12px', width: '100%', '& .MuiAlert-message': {fontWeight: 600}}}>
                        {intl.formatMessage({id: 'publicapi.modal.warning'})}
                    </Alert>
                </Box>
            </DialogContent>
            <DialogActions sx={{p: 3, justifyContent: 'center'}}>
                <AppButton variant="contained" onClick={onClose} sx={{px: 6}}>
                    {intl.formatMessage({id: 'schedule.details.close'})}
                </AppButton>
            </DialogActions>
        </Dialog>
    );
}
