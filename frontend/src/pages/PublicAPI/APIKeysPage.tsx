import {useState} from 'react';
import {Box, Typography, Paper, Alert} from '@mui/material';
import {Tag} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {PageBreadcrumbs, type BreadcrumbItem, AppButton} from '@components/Common';
import {generateApiKey} from '@api/domains/users/apikeys';
import {useTheme} from '@mui/material/styles';
import APIKeyDisplayModal from './components/APIKeyDisplayModal';

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

            <APIKeyDisplayModal 
                open={modalOpen} 
                apiKey={newKey} 
                onClose={() => { setModalOpen(false); }} 
            />
        </Box>
    );
}
