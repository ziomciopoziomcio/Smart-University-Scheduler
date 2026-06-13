import {useState} from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import {ContentCopy, Tag, WarningAmber} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {PageBreadcrumbs, type BreadcrumbItem, AppButton} from '@components/Common';
import {generateApiKey} from '@api/domains/users/apikeys';
import {useTheme} from '@mui/material/styles';

export default function APIKeysPage() {
    const intl = useIntl();
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            label: intl.formatMessage({id: 'sidebar.publicapi'}),
            path: '/public-api'
        }
    ];

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await generateApiKey();
            setNewKey(data.api_key);
            setModalOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error generating API key');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey).catch(() => { /* ignore */ });
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, width: '100%'}}>
            <PageBreadcrumbs items={breadcrumbs}/>

            <Paper sx={{p: 4, borderRadius: '24px'}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: theme.palette.primary.main + '15',
                        color: theme.palette.primary.main
                    }}>
                        <Tag fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            {intl.formatMessage({id: 'publicapi.title'})}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {intl.formatMessage({id: 'publicapi.description'})}
                        </Typography>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{mb: 3, borderRadius: '12px'}}>
                        {error}
                    </Alert>
                )}

                <Box sx={{mt: 4}}>
                    <AppButton
                        variant="contained"
                        onClick={() => { void handleGenerate(); }}
                        loading={loading}
                        startIcon={<Tag />}
                        sx={{px: 4}}
                    >
                        {intl.formatMessage({id: 'publicapi.generateButton'})}
                    </AppButton>
                </Box>
            </Paper>

            <Dialog
                open={modalOpen}
                disableEscapeKeyDown
                onClose={(event, reason) => {
                    void event;
                    // Only allow closing via the button
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                    setModalOpen(false);
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
                                {newKey}
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
                        onClick={() => { setModalOpen(false); }}
                        sx={{px: 6}}
                    >
                        {intl.formatMessage({id: 'schedule.details.close'})}
                    </AppButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
