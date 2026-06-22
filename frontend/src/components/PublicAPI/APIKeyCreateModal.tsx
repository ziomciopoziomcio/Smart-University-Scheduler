import {useState} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    Alert
} from '@mui/material';
import {useIntl} from 'react-intl';
import {AppButton} from '@components/Common';

interface APIKeyCreateModalProps {
    open: boolean;
    onClose: () => void;
    onGenerate: (name: string) => Promise<void>;
}

export const APIKeyCreateModal = ({open, onClose, onGenerate}: APIKeyCreateModalProps) => {
    const intl = useIntl();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        if (loading) return;
        setName('');
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onGenerate(name.trim());
            setName('');
            setError(null);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error generating API key');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
            PaperProps={{sx: {borderRadius: '24px', p: 1}}}>
            <DialogTitle sx={{fontWeight: 700, pb: 1}}>
                {intl.formatMessage({id: 'publicapi.modalCreateTitle'})}
            </DialogTitle>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogContent sx={{py: 1}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                        {error && (
                            <Alert severity="error" sx={{borderRadius: '12px'}}>
                                {error}
                            </Alert>
                        )}
                        <TextField
                            label={intl.formatMessage({id: 'publicapi.nameLabel'})}
                            placeholder={intl.formatMessage({id: 'publicapi.namePlaceholder'})}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            autoFocus
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{p: 3, gap: 1}}>
                    <AppButton variant="text" onClick={handleClose} disabled={loading} sx={{flexGrow: 1}}>
                        {intl.formatMessage({id: 'academics.common.cancel'})}
                    </AppButton>
                    <AppButton type="submit" variant="contained" loading={loading} sx={{flexGrow: 1}}>
                        {intl.formatMessage({id: 'publicapi.generateButton'})}
                    </AppButton>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
