import {
    Box,
    Chip,
    Typography,
} from '@mui/material';
import {useIntl} from 'react-intl';

import {
    type ScheduleSuggestion,
} from '@api/domains/schedules/suggestions';

interface SuggestionMetaPanelProps {
    suggestion: ScheduleSuggestion;
    changedFieldsCount: number;
}

export function SuggestionMetaPanel({
                                        suggestion,
                                        changedFieldsCount,
                                    }: SuggestionMetaPanelProps) {
    const intl = useIntl();

    return (
        <Box
            sx={{
                mb: 4,
                p: 2,
                borderRadius: '18px',
                bgcolor: '#F8F9FC',
                border: '1px solid #EEF1F6',
            }}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap'}}>
                <Box sx={{textAlign: 'left'}}>
                    <Typography
                        sx={{fontSize: 13, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase'}}>
                        {intl.formatMessage({id: 'suggestions.details.reason'})}
                    </Typography>
                    <Typography sx={{mt: 0.6, fontSize: 15, color: '#555555', lineHeight: 1.5}}>
                        {suggestion.reason || intl.formatMessage({id: 'suggestions.details.noReason'})}
                    </Typography>
                </Box>

                <Box sx={{display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap'}}>
                    <Chip
                        label={intl.formatMessage(
                            {id: 'suggestions.details.source'},
                            {source: suggestion.source},
                        )}
                        sx={{
                            borderRadius: '999px',
                            bgcolor: '#FFFFFF',
                            border: '1px solid #E6EAF2',
                            color: '#687085',
                            fontWeight: 700,
                        }}
                    />
                    <Chip
                        label={intl.formatMessage(
                            {id: 'suggestions.details.changedFields'},
                            {count: changedFieldsCount},
                        )}
                        sx={{
                            borderRadius: '999px',
                            bgcolor: '#FFF1F1',
                            border: '1px solid #F4C3C3',
                            color: '#A94444',
                            fontWeight: 700,
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}