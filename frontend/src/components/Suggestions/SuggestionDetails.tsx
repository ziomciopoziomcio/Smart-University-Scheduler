import {useMemo} from 'react';
import {
    Alert,
    Box,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {useIntl} from 'react-intl';

import {
    type ScheduleSuggestion,
} from '@api/domains/schedules/suggestions';

import {StatusChip} from './StatusChip';
import {SuggestionActions} from './SuggestionActions';
import {SuggestionChangeRow} from './SuggestionChangeRow';
import {SuggestionDateInfo} from './SuggestionDateInfo';
import {SuggestionMetaPanel} from './SuggestionMetaPanel';
import {
    getAllDisplayFields,
    getChangedFields,
    normalizeSnapshot,
} from './suggestionUtils';

interface SuggestionDetailsProps {
    suggestion: ScheduleSuggestion | null;
    onResolve: (status: 'ACCEPTED' | 'REJECTED') => Promise<void>;
    resolving: boolean;
}

function EmptySuggestionDetails() {
    const intl = useIntl();

    return (
        <Box
            sx={{
                height: '100%',
                minHeight: 420,
                borderRadius: '24px',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                textAlign: 'center',
            }}
        >
            <Box>
                <CompareArrowsIcon sx={{fontSize: 54, color: '#C5CAD4', mb: 1}}/>
                <Typography sx={{fontSize: 20, fontWeight: 700, color: '#666666'}}>
                    {intl.formatMessage({id: 'suggestions.empty.selectTitle'})}
                </Typography>
                <Typography sx={{mt: 0.8, fontSize: 14.5, color: '#8A8A8A'}}>
                    {intl.formatMessage({id: 'suggestions.empty.selectDescription'})}
                </Typography>
            </Box>
        </Box>
    );
}

export function SuggestionDetails({
                                      suggestion,
                                      onResolve,
                                      resolving,
                                  }: SuggestionDetailsProps) {
    const intl = useIntl();

    const before = useMemo(
        () => suggestion ? normalizeSnapshot(suggestion.stateBefore) : null,
        [suggestion],
    );

    const after = useMemo(
        () => suggestion ? normalizeSnapshot(suggestion.stateAfter) : null,
        [suggestion],
    );

    const fields = useMemo(
        () => before && after ? getAllDisplayFields(before, after, intl) : [],
        [before, after, intl],
    );

    const changedFields = useMemo(
        () => before && after ? getChangedFields(before, after, intl) : [],
        [before, after, intl],
    );

    if (!suggestion || !before || !after) {
        return <EmptySuggestionDetails/>;
    }

    const title = after.title || before.title;

    return (
        <Box
            sx={{
                borderRadius: '24px',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
            }}
        >
            <Box sx={{p: {xs: 3, md: 4}}}>
                <Box sx={{textAlign: 'left', mb: 3}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap'}}>
                        <Typography
                            sx={{
                                fontSize: {xs: 25, md: 30},
                                fontWeight: 700,
                                color: '#4F4F4F',
                                lineHeight: 1.1,
                                textAlign: 'left',
                            }}
                        >
                            {title}
                        </Typography>

                        <StatusChip status={suggestion.status}/>
                    </Box>

                    <Typography sx={{mt: 0.8, fontSize: 13, color: '#A0A0A0', textAlign: 'left'}}>
                        {intl.formatMessage(
                            {id: 'suggestions.details.targetSession'},
                            {id: suggestion.targetClassSessionId},
                        )}
                    </Typography>
                </Box>

                <SuggestionMetaPanel
                    suggestion={suggestion}
                    changedFieldsCount={changedFields.length}
                />

                {fields.length === 0 && (
                    <Alert severity="warning" sx={{mb: 2, borderRadius: '16px'}}>
                        {intl.formatMessage({id: 'suggestions.details.unrecognizedPayload'})}
                    </Alert>
                )}

                <Stack spacing={2.2}>
                    <Stack spacing={2}>
                        {fields.map((field) => (
                            <SuggestionChangeRow
                                key={field.key}
                                field={field}
                            />
                        ))}
                    </Stack>

                    <Divider sx={{pt: 0.8}}/>

                    <SuggestionDateInfo
                        createdAt={suggestion.createdAt}
                        resolvedAt={suggestion.resolvedAt}
                    />

                    <SuggestionActions
                        status={suggestion.status}
                        resolving={resolving}
                        onResolve={onResolve}
                    />
                </Stack>
            </Box>
        </Box>
    );
}