import {useCallback, useEffect, useMemo, useState, type ChangeEvent} from 'react';
import {
    Alert,
    Box,
    type SelectChangeEvent,
} from '@mui/material';
import {useIntl} from 'react-intl';

import {
    getScheduleSuggestions,
    resolveScheduleSuggestion,
    type ScheduleSuggestion,
} from '@api/domains/schedules/suggestions';

import {
    SuggestionsHero,
    SuggestionsQueuePanel,
    SuggestionDetails,
    type SuggestionStatusFilter,
} from '@components/Suggestions';

export default function SuggestionsPage() {
    const intl = useIntl();

    const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<SuggestionStatusFilter>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const filteredSuggestions = suggestions;

    const selectedSuggestion = useMemo(
        () => filteredSuggestions.find((suggestion) => suggestion.id === selectedId) ?? filteredSuggestions[0] ?? null,
        [selectedId, filteredSuggestions],
    );

    const loadSuggestions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getScheduleSuggestions({
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                search: searchQuery.trim() || undefined,
                limit: 50,
                offset: 0,
            });

            const responseItems = response.items ?? [];

            setSuggestions(responseItems);

            setSelectedId((currentSelectedId) => {
                if (responseItems.length === 0) {
                    return null;
                }

                const currentStillExists = responseItems.some((item) => item.id === currentSelectedId);

                return currentStillExists ? currentSelectedId : responseItems[0].id;
            });
        } catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : intl.formatMessage({id: 'suggestions.errors.load'}));

            setSuggestions([]);
            setSelectedId(null);
        } finally {
            setLoading(false);
        }
    }, [intl, searchQuery, statusFilter]);

    useEffect(() => {
        void loadSuggestions();
    }, [loadSuggestions]);

    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        const nextStatus = event.target.value as SuggestionStatusFilter;

        setStatusFilter(nextStatus);
        setSelectedId(null);
    };

    const handleSearchQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        setSelectedId(null);
    };

    const handleSuggestionSelect = (suggestionId: number) => {
        setSelectedId(suggestionId);
    };

    const handleResolve = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!selectedSuggestion) {
            return;
        }

        setResolvingId(selectedSuggestion.id);
        setError(null);

        try {
            const updatedSuggestion = await resolveScheduleSuggestion(selectedSuggestion.id, {status});

            setSuggestions((current) => current.map((suggestion) => (
                suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion
            )));
        } catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : intl.formatMessage({id: 'suggestions.errors.resolve'}));
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <Box sx={{width: '100%', gap: 2, flexDirection: 'column', display: 'flex'}}>
            <SuggestionsHero
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                onRefresh={() => void loadSuggestions()}
                loading={loading}
            />

            {error && (
                <Alert severity="error" sx={{borderRadius: '16px'}}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: '1fr', lg: '390px minmax(0, 1fr)'},
                    gap: 2,
                    alignItems: 'start',
                }}
            >
                <SuggestionsQueuePanel
                    suggestions={filteredSuggestions}
                    selectedSuggestionId={selectedSuggestion?.id ?? null}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchQueryChange={handleSearchQueryChange}
                    onSuggestionSelect={handleSuggestionSelect}
                />

                <SuggestionDetails
                    suggestion={selectedSuggestion}
                    onResolve={handleResolve}
                    resolving={Boolean(selectedSuggestion && resolvingId === selectedSuggestion.id)}
                />
            </Box>
        </Box>
    );
}