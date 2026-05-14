import {
    Box,
    Chip,
    Typography,
} from '@mui/material';
import {useIntl} from 'react-intl';

import {
    type ScheduleSuggestion,
} from '@api/domains/schedules/suggestions';

import {StatusChip} from './StatusChip';
import {
    formatDate,
    getChangedFields,
    normalizeSnapshot,
} from './suggestionUtils';

interface SuggestionListItemProps {
    suggestion: ScheduleSuggestion;
    selected: boolean;
    onClick: () => void;
}

export function SuggestionListItem({
                                       suggestion,
                                       selected,
                                       onClick,
                                   }: SuggestionListItemProps) {
    const intl = useIntl();
    const before = normalizeSnapshot(suggestion.stateBefore);
    const after = normalizeSnapshot(suggestion.stateAfter);
    const changedFields = getChangedFields(before, after, intl);

    return (
        <Box
            onClick={onClick}
            sx={{
                p: 2,
                cursor: 'pointer',
                borderRadius: '18px',
                border: selected ? '1px solid #D6DBE8' : '1px solid transparent',
                bgcolor: selected ? '#F7F9FD' : '#FFFFFF',
                transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                '&:hover': {
                    bgcolor: '#F7F9FD',
                    borderColor: '#E1E5EF',
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5}}>
                <Box sx={{minWidth: 0, textAlign: 'left'}}>
                    <Typography
                        sx={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#454545',
                            lineHeight: 1.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                        }}
                    >
                        {after.title || before.title}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.6,
                            fontSize: 13.5,
                            color: '#8A8A8A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                        }}
                    >
                        {suggestion.reason || intl.formatMessage({id: 'suggestions.details.noReason'})}
                    </Typography>
                </Box>

                <StatusChip status={suggestion.status}/>
            </Box>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 1.6, flexWrap: 'wrap'}}>
                <Chip
                    label={intl.formatMessage(
                        {id: 'suggestions.queue.changesCount'},
                        {count: changedFields.length},
                    )}
                    size="small"
                    sx={{
                        height: 24,
                        borderRadius: '999px',
                        bgcolor: changedFields.length > 0 ? '#FFF1F1' : '#F1F3F8',
                        color: changedFields.length > 0 ? '#A94444' : '#687085',
                        fontWeight: 600,
                        fontSize: 12,
                    }}
                />

                <Typography sx={{ml: 'auto', fontSize: 12.5, color: '#9A9A9A'}}>
                    {formatDate(suggestion.createdAt)}
                </Typography>
            </Box>
        </Box>
    );
}