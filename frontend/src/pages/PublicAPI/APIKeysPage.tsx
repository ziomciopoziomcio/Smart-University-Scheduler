import {useState} from 'react';
import {Box} from '@mui/material';
import {useIntl} from 'react-intl';
import {PageBreadcrumbs, type BreadcrumbItem} from '@components/Common';
import {generateApiKey} from '@api/domains/users/apikeys';
import APIKeyDisplayModal from '@components/PublicAPI/APIKeyDisplayModal.tsx';
import {APIKeyGeneratorCard} from '@components/PublicAPI/APIKeyGeneratorCard';

export default function APIKeysPage() {
    const intl = useIntl();
    const [loading, setLoading] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [{label: intl.formatMessage({id: 'sidebar.publicapi'}), path: '/public-api'}];

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
            <APIKeyGeneratorCard onGenerate={() => { void handleGenerate(); }} loading={loading} error={error} />
            <APIKeyDisplayModal open={modalOpen} apiKey={newKey} onClose={() => setModalOpen(false)} />
        </Box>
    );
}
