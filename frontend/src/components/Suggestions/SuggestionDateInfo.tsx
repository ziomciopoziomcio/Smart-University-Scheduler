import {
    Box,
    Typography,
} from '@mui/material';
import {useIntl} from 'react-intl';

import {formatDate} from './suggestionUtils';

interface SuggestionDateInfoProps {
    createdAt: string;
    resolvedAt: string | null;
}

export function SuggestionDateInfo({
                                       createdAt,
                                       resolvedAt,
                                   }: SuggestionDateInfoProps) {
    const intl = useIntl();

    return (
        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}, gap: 2}}>
            <Box
                sx={{
                    p: 2,
                    borderRadius: '18px',
                    bgcolor: '#FBFCFF',
                    border: '1px solid #EEF1F6',
                    textAlign: 'left',
                }}
            >
                <Typography sx={{fontSize: 13, fontWeight: 800, color: '#6B7280', mb: 1}}>
                    {intl.formatMessage({id: 'suggestions.details.created'})}
                </Typography>
                <Typography sx={{fontSize: 14.5, color: '#555555'}}>
                    {formatDate(createdAt)}
                </Typography>
            </Box>

            <Box
                sx={{
                    p: 2,
                    borderRadius: '18px',
                    bgcolor: '#FBFCFF',
                    border: '1px solid #EEF1F6',
                    textAlign: 'left',
                }}
            >
                <Typography sx={{fontSize: 13, fontWeight: 800, color: '#6B7280', mb: 1}}>
                    {intl.formatMessage({id: 'suggestions.details.resolved'})}
                </Typography>
                <Typography sx={{fontSize: 14.5, color: '#555555'}}>
                    {resolvedAt ? formatDate(resolvedAt) : '—'}
                </Typography>
            </Box>
        </Box>
    );
}