import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    type SelectChangeEvent,
} from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {useIntl} from 'react-intl';

import {getStatusLabel, type SuggestionStatusFilter} from './StatusChip';

const statusOptions: SuggestionStatusFilter[] = [
    'ALL',
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'FAILED',
];

interface SuggestionsHeroProps {
    statusFilter: SuggestionStatusFilter;
    onStatusFilterChange: (event: SelectChangeEvent) => void;
    onRefresh: () => void;
    loading: boolean;
}

export function SuggestionsHero({
                                    statusFilter,
                                    onStatusFilterChange,
                                    onRefresh,
                                    loading,
                                }: SuggestionsHeroProps) {
    const intl = useIntl();

    return (
        <Box
            sx={{
                px: {xs: 3, md: 5},
                py: {xs: 3.5, md: 4.5},
                borderRadius: '24px',
                background: '#ffffff',
                minHeight: {xs: 190, md: 220},
                display: 'flex',
                alignItems: {xs: 'flex-start', md: 'center'},
                justifyContent: 'space-between',
                gap: {xs: 3, md: 5},
                flexDirection: {xs: 'column', md: 'row'},
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: {xs: 3, md: 5},
                    width: '100%',
                }}
            >
                <InboxOutlinedIcon
                    sx={{
                        fontSize: {xs: 72, md: 96},
                        color: '#A8ADB7',
                        flexShrink: 0,
                    }}
                />

                <Box sx={{textAlign: 'left', minWidth: 0}}>
                    <Typography
                        sx={{
                            fontSize: {xs: 30, md: 40},
                            fontWeight: 700,
                            color: '#4F4F4F',
                            lineHeight: 1.08,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        {intl.formatMessage({id: 'suggestions.hero.title'})}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 1.4,
                            fontSize: {xs: 15, md: 16.5},
                            color: '#7A7A7A',
                            maxWidth: 720,
                            lineHeight: 1.6,
                        }}
                    >
                        {intl.formatMessage({id: 'suggestions.hero.description'})}
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    width: {xs: '100%', md: 'auto'},
                    p: 1,
                    borderRadius: '18px',
                    bgcolor: '#F8F9FC',
                    border: '1px solid #EEF1F6',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
            >
                <FormControl
                    size="small"
                    sx={{
                        minWidth: {xs: 1, md: 180},
                        flex: {xs: 1, md: 'unset'},
                        '& .MuiInputLabel-root': {
                            color: '#7A7A7A',
                            fontWeight: 600,
                        },
                    }}
                >
                    <InputLabel>{intl.formatMessage({id: 'suggestions.filters.status'})}</InputLabel>
                    <Select
                        value={statusFilter}
                        label={intl.formatMessage({id: 'suggestions.filters.status'})}
                        onChange={onStatusFilterChange}
                        sx={{
                            borderRadius: '14px',
                            bgcolor: '#FFFFFF',
                            fontWeight: 700,
                            color: '#4F5E82',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#DDE3EF',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#C8D0E0',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#4F5E82',
                            },
                        }}
                    >
                        {statusOptions.map((status) => (
                            <MenuItem key={status} value={status}>
                                {getStatusLabel(status, intl)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16}/> : <RefreshRoundedIcon/>}
                    onClick={onRefresh}
                    disabled={loading}
                    sx={{
                        height: 40,
                        px: 2.2,
                        borderRadius: '14px',
                        textTransform: 'none',
                        color: '#4F5E82',
                        borderColor: '#DDE3EF',
                        bgcolor: '#FFFFFF',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(79, 94, 130, 0.08)',
                        '&:hover': {
                            borderColor: '#BFC7DA',
                            bgcolor: '#FDFEFF',
                            boxShadow: '0 6px 16px rgba(79, 94, 130, 0.12)',
                        },
                    }}
                >
                    {intl.formatMessage({id: 'suggestions.actions.refresh'})}
                </Button>
            </Box>
        </Box>
    );
}