import {type ChangeEvent} from 'react';
import {
    Box,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {useIntl} from 'react-intl';

import {
    type ScheduleSuggestion,
} from '@api/domains/schedules/suggestions';

import {SuggestionListItem} from './SuggestionListItem';
import {SuggestionSearchField} from './SuggestionSearchField';

interface SuggestionsQueuePanelProps {
    suggestions: ScheduleSuggestion[];
    selectedSuggestionId: number | null;
    loading: boolean;
    searchQuery: string;
    onSearchQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSuggestionSelect: (suggestionId: number) => void;
}

export function SuggestionsQueuePanel({
                                          suggestions,
                                          selectedSuggestionId,
                                          loading,
                                          searchQuery,
                                          onSearchQueryChange,
                                          onSuggestionSelect,
                                      }: SuggestionsQueuePanelProps) {
    const intl = useIntl();

    return (
        <Box
            sx={{
                borderRadius: '24px',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                p: 2,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    px: 0.5,
                }}
            >
                <Typography sx={{fontSize: 18, fontWeight: 800, color: '#4F4F4F', textAlign: 'left'}}>
                    {intl.formatMessage({id: 'suggestions.queue.title'})}
                </Typography>
                <Typography sx={{fontSize: 13.5, color: '#8A8A8A'}}>
                    {intl.formatMessage(
                        {id: 'suggestions.queue.itemsCount'},
                        {count: suggestions.length},
                    )}
                </Typography>
            </Box>

            <SuggestionSearchField
                value={searchQuery}
                onChange={onSearchQueryChange}
            />

            {loading && suggestions.length === 0 && (
                <Box sx={{py: 8, display: 'flex', justifyContent: 'center'}}>
                    <CircularProgress/>
                </Box>
            )}

            {!loading && suggestions.length === 0 && (
                <Box sx={{py: 7, px: 2, textAlign: 'center'}}>
                    <CompareArrowsIcon sx={{fontSize: 48, color: '#C5CAD4', mb: 1}}/>
                    <Typography sx={{fontSize: 18, fontWeight: 700, color: '#666666'}}>
                        {intl.formatMessage({id: 'suggestions.empty.noSuggestionsTitle'})}
                    </Typography>
                    <Typography sx={{mt: 0.8, fontSize: 14, color: '#8A8A8A'}}>
                        {intl.formatMessage({id: 'suggestions.empty.noSuggestionsDescription'})}
                    </Typography>
                </Box>
            )}

            <Stack spacing={1}>
                {suggestions.map((suggestion) => (
                    <SuggestionListItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        selected={selectedSuggestionId === suggestion.id}
                        onClick={() => onSuggestionSelect(suggestion.id)}
                    />
                ))}
            </Stack>
        </Box>
    );
}