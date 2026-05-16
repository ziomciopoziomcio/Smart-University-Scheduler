import {Chip} from '@mui/material';
import {useIntl, type IntlShape} from 'react-intl';

import {
    type ScheduleSuggestionStatus,
} from '@api/domains/schedules/suggestions';

export type SuggestionStatusFilter = ScheduleSuggestionStatus | 'ALL';

const statusColors: Record<ScheduleSuggestionStatus, {
    color: string;
    background: string;
    border: string;
}> = {
    PENDING: {
        color: '#7A5A00',
        background: '#FFF7DF',
        border: '#FFE2A3',
    },
    ACCEPTED: {
        color: '#25643B',
        background: '#EAF7EF',
        border: '#BFE7CE',
    },
    REJECTED: {
        color: '#8E2B2B',
        background: '#FFF0F0',
        border: '#F4B8B8',
    },
    FAILED: {
        color: '#6B374C',
        background: '#FFF0F7',
        border: '#F2B6D0',
    },
};

export function getStatusLabel(status: SuggestionStatusFilter, intl: IntlShape): string {
    const labels: Record<SuggestionStatusFilter, string> = {
        ALL: intl.formatMessage({id: 'suggestions.status.all'}),
        PENDING: intl.formatMessage({id: 'suggestions.status.pending'}),
        ACCEPTED: intl.formatMessage({id: 'suggestions.status.accepted'}),
        REJECTED: intl.formatMessage({id: 'suggestions.status.rejected'}),
        FAILED: intl.formatMessage({id: 'suggestions.status.failed'}),
    };

    return labels[status];
}

export function StatusChip({status}: { status: ScheduleSuggestionStatus }) {
    const intl = useIntl();
    const palette = statusColors[status];

    return (
        <Chip
            label={getStatusLabel(status, intl)}
            size="small"
            sx={{
                height: 28,
                borderRadius: '999px',
                color: palette.color,
                bgcolor: palette.background,
                border: `1px solid ${palette.border}`,
                fontWeight: 700,
                '& .MuiChip-label': {
                    px: 1.4,
                },
            }}
        />
    );
}