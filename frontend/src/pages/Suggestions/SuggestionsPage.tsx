import {useCallback, useMemo, useState, type ChangeEvent} from 'react';
import {
    Alert,
    Box,
    type SelectChangeEvent,
} from '@mui/material';
import {useIntl} from 'react-intl';

import {
    type ScheduleSuggestion,
} from '@api/domains/schedules/suggestions';

import {
    matchesSuggestionSearch,
    SuggestionsHero,
    SuggestionsQueuePanel,
    SuggestionDetails,
    type SuggestionStatusFilter,
} from '@components/suggestions';

// TODO: odkomentować po podpięciu backendu.
// import {
//     getScheduleSuggestions,
//     resolveScheduleSuggestion,
// } from '@api/domains/schedules/suggestions';

const MOCK_SUGGESTIONS: ScheduleSuggestion[] = [
    {
        id: 1,
        source: 'RAG',
        reason: 'Sala jest za mała dla liczby studentów przypisanych do tej grupy.',
        targetClassSessionId: '8db87261-1020-42b2-9e9d-7f12b23a9101',
        status: 'PENDING',
        createdAt: '2026-05-13T08:40:00Z',
        resolvedAt: null,
        stateBefore: {
            title: 'Algorytmy i struktury danych',
            dayOfWeek: 'Monday',
            startTime: '08:00',
            endTime: '09:30',
            instructorName: 'dr Anna Kowalska',
            roomName: 'B-214',
            building: 'B',
            campus: 'Main Campus',
        },
        stateAfter: {
            title: 'Algorytmy i struktury danych',
            dayOfWeek: 'Monday',
            startTime: '10:00',
            endTime: '11:30',
            instructorName: 'dr Anna Kowalska',
            roomName: 'C-301',
            building: 'C',
            campus: 'Main Campus',
            proposed_room_id: 301,
        },
    },
    {
        id: 2,
        source: 'OPTIMIZER',
        reason: 'Propozycja zmniejsza konflikt prowadzącego między dwiema sesjami.',
        targetClassSessionId: '2fbe2bf3-f1bb-46aa-9349-a8492e19d3d2',
        status: 'PENDING',
        createdAt: '2026-05-13T09:15:00Z',
        resolvedAt: null,
        stateBefore: {
            title: 'Bazy danych',
            dayOfWeek: 'Wednesday',
            startTime: '12:00',
            endTime: '13:30',
            instructorName: 'prof. Jan Nowak',
            roomName: 'A-102',
            building: 'A',
            campus: 'Main Campus',
        },
        stateAfter: {
            title: 'Bazy danych',
            dayOfWeek: 'Thursday',
            startTime: '12:00',
            endTime: '13:30',
            instructorName: 'prof. Jan Nowak',
            roomName: 'A-102',
            building: 'A',
            campus: 'Main Campus',
        },
    },
    {
        id: 3,
        source: 'MANUAL_REVIEW',
        reason: 'Zmiana zaakceptowana wcześniej przez koordynatora.',
        targetClassSessionId: 'ffb8435e-cfc1-4bf3-91ef-62487f4e1c13',
        status: 'ACCEPTED',
        createdAt: '2026-05-12T11:30:00Z',
        resolvedAt: '2026-05-12T12:05:00Z',
        stateBefore: {
            title: 'Programowanie obiektowe',
            dayOfWeek: 'Friday',
            startTime: '14:00',
            endTime: '15:30',
            instructorName: 'mgr Piotr Zieliński',
            roomName: 'D-020',
            building: 'D',
            campus: 'South Campus',
        },
        stateAfter: {
            title: 'Programowanie obiektowe',
            dayOfWeek: 'Friday',
            startTime: '14:00',
            endTime: '15:30',
            instructorName: 'mgr Piotr Zieliński',
            roomName: 'D-118',
            building: 'D',
            campus: 'South Campus',
            proposed_room_id: 118,
        },
    },
];

export default function SuggestionsPage() {
    const intl = useIntl();

    const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>(MOCK_SUGGESTIONS);
    const [selectedId, setSelectedId] = useState<number | null>(MOCK_SUGGESTIONS[0]?.id ?? null);
    const [statusFilter, setStatusFilter] = useState<SuggestionStatusFilter>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const filteredSuggestions = useMemo(() => {
        return suggestions.filter((suggestion) => {
            const matchesStatus = statusFilter === 'ALL' || suggestion.status === statusFilter;
            const matchesSearch = matchesSuggestionSearch(suggestion, searchQuery, intl);

            return matchesStatus && matchesSearch;
        });
    }, [intl, searchQuery, suggestions, statusFilter]);

    const selectedSuggestion = useMemo(
        () => filteredSuggestions.find((suggestion) => suggestion.id === selectedId) ?? filteredSuggestions[0] ?? null,
        [selectedId, filteredSuggestions],
    );

    const loadSuggestions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await new Promise((resolve) => {
                window.setTimeout(resolve, 300);
            });

            setSuggestions(MOCK_SUGGESTIONS);

            const nextSuggestions = MOCK_SUGGESTIONS.filter((suggestion) => {
                const matchesStatus = statusFilter === 'ALL' || suggestion.status === statusFilter;
                const matchesSearch = matchesSuggestionSearch(suggestion, searchQuery, intl);

                return matchesStatus && matchesSearch;
            });

            setSelectedId((currentSelectedId) => {
                if (nextSuggestions.length === 0) {
                    return null;
                }

                const currentStillExists = nextSuggestions.some((item) => item.id === currentSelectedId);

                return currentStillExists ? currentSelectedId : nextSuggestions[0].id;
            });

            // TODO: prawdziwy fetch na później.
            //
            // const response = await getScheduleSuggestions({
            //     status: statusFilter === 'ALL' ? undefined : statusFilter,
            //     search: searchQuery.trim() || undefined,
            //     limit: 50,
            //     offset: 0,
            // });
            //
            // setSuggestions(response.items);
            //
            // setSelectedId((currentSelectedId) => {
            //     if (response.items.length === 0) {
            //         return null;
            //     }
            //
            //     const currentStillExists = response.items.some((item) => item.id === currentSelectedId);
            //
            //     return currentStillExists ? currentSelectedId : response.items[0].id;
            // });
        } catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : intl.formatMessage({id: 'suggestions.errors.load'}));
        } finally {
            setLoading(false);
        }
    }, [intl, searchQuery, statusFilter]);

    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        const nextStatus = event.target.value as SuggestionStatusFilter;

        setStatusFilter(nextStatus);

        const nextSuggestions = suggestions.filter((suggestion) => {
            const matchesStatus = nextStatus === 'ALL' || suggestion.status === nextStatus;
            const matchesSearch = matchesSuggestionSearch(suggestion, searchQuery, intl);

            return matchesStatus && matchesSearch;
        });

        setSelectedId(nextSuggestions[0]?.id ?? null);
    };

    const handleSearchQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextSearchQuery = event.target.value;

        setSearchQuery(nextSearchQuery);

        const nextSuggestions = suggestions.filter((suggestion) => {
            const matchesStatus = statusFilter === 'ALL' || suggestion.status === statusFilter;
            const matchesSearch = matchesSuggestionSearch(suggestion, nextSearchQuery, intl);

            return matchesStatus && matchesSearch;
        });

        setSelectedId((currentSelectedId) => {
            if (nextSuggestions.length === 0) {
                return null;
            }

            const currentStillExists = nextSuggestions.some((suggestion) => suggestion.id === currentSelectedId);

            return currentStillExists ? currentSelectedId : nextSuggestions[0].id;
        });
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
            await new Promise((resolve) => {
                window.setTimeout(resolve, 300);
            });

            const updatedSuggestion: ScheduleSuggestion = {
                ...selectedSuggestion,
                status,
                resolvedAt: new Date().toISOString(),
            };

            setSuggestions((current) => current.map((suggestion) => (
                suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion
            )));

            // TODO: prawdziwy request na później.
            //
            // const updatedSuggestion = await resolveScheduleSuggestion(selectedSuggestion.id, {status});
            //
            // setSuggestions((current) => current.map((suggestion) => (
            //     suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion
            // )));
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