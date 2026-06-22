import {useState, useEffect, useCallback} from 'react';
import {Box, CircularProgress, Alert, Snackbar} from '@mui/material';
import {useIntl} from 'react-intl';
import {PageBreadcrumbs, type BreadcrumbItem} from '@components/Common';
import {generateApiKey, fetchApiKeys, revokeApiKey, type APIKeyInfo} from '@api/domains/users/apikeys';
import APIKeyDisplayModal from '@components/PublicAPI/APIKeyDisplayModal.tsx';
import {APIKeyGeneratorCard} from '@components/PublicAPI/APIKeyGeneratorCard';
import {APIKeyList} from '@components/PublicAPI/APIKeyList';
import {APIKeyCreateModal} from '@components/PublicAPI/APIKeyCreateModal';

export default function APIKeysPage() {
    const intl = useIntl();
    const [newKey, setNewKey] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    
    const [keys, setKeys] = useState<APIKeyInfo[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const breadcrumbs: BreadcrumbItem[] = [{label: intl.formatMessage({id: 'sidebar.publicapi'}), path: '/public-api'}];

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const loadKeys = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        try {
            const data = await fetchApiKeys();
            setKeys(data);
        } catch (err) {
            setListError(err instanceof Error ? err.message : 'Error fetching API keys');
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadKeys();
    }, [loadKeys]);

    const handleGenerate = async (name: string): Promise<void> => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            const errorMsg = intl.formatMessage({id: 'publicapi.errors.nameRequired'});
            showSnackbar(errorMsg, 'error');
            throw new Error(errorMsg);
        }

        try {
            const data = await generateApiKey(trimmedName);
            setNewKey(data.api_key);
            setModalOpen(true);
            void loadKeys();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error generating API key';
            showSnackbar(errorMsg, 'error');
            throw err;
        }
    };

    const handleRevoke = async (keyId: number) => {
        try {
            await revokeApiKey(keyId);
            void loadKeys();
            showSnackbar(intl.formatMessage({id: 'publicapi.revokeSuccess'}), 'success');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error revoking API key';
            showSnackbar(errorMsg, 'error');
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, width: '100%'}}>
            <PageBreadcrumbs items={breadcrumbs}/>

            <APIKeyGeneratorCard onGenerate={() => setCreateModalOpen(true)} />
            
            {listLoading && (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                    <CircularProgress />
                </Box>
            )}
            
            {listError && (
                <Alert severity="error" sx={{borderRadius: '12px'}}>
                    {listError}
                </Alert>
            )}

            {!listLoading && !listError && (
                <APIKeyList keys={keys} onRevoke={handleRevoke} />
            )}

            <APIKeyCreateModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onGenerate={handleGenerate}
            />

            <APIKeyDisplayModal open={modalOpen} apiKey={newKey} onClose={() => setModalOpen(false)} />

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert severity={snackbarSeverity} sx={{width: '100%', borderRadius: '12px', boxShadow: 3}}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
