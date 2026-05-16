import {
    Alert,
    Box,
    Button,
    Tooltip,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {useIntl} from 'react-intl';

import {
    type ScheduleSuggestionStatus,
} from '@api/domains/schedules/suggestions';

interface SuggestionActionsProps {
    status: ScheduleSuggestionStatus;
    resolving: boolean;
    onResolve: (status: 'ACCEPTED' | 'REJECTED') => Promise<void>;
}

export function SuggestionActions({
                                      status,
                                      resolving,
                                      onResolve,
                                  }: SuggestionActionsProps) {
    const intl = useIntl();

    if (status !== 'PENDING') {
        return (
            <Alert severity="info" sx={{borderRadius: '16px'}}>
                {intl.formatMessage({id: 'suggestions.details.alreadyResolved'})}
            </Alert>
        );
    }

    return (
        <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1, flexWrap: 'wrap'}}>
            <Tooltip title={intl.formatMessage({id: 'suggestions.actions.rejectTooltip'})}>
                <span>
                    <Button
                        variant="outlined"
                        startIcon={<CloseRoundedIcon/>}
                        onClick={() => void onResolve('REJECTED')}
                        disabled={resolving}
                        sx={{
                            height: 48,
                            px: 3,
                            borderRadius: '15px',
                            textTransform: 'none',
                            color: '#A94444',
                            borderColor: '#E0A0A0',
                            fontWeight: 800,
                            '&:hover': {
                                borderColor: '#D45F5F',
                                bgcolor: '#FFF8F8',
                            },
                        }}
                    >
                        {intl.formatMessage({id: 'suggestions.actions.reject'})}
                    </Button>
                </span>
            </Tooltip>

            <Tooltip title={intl.formatMessage({id: 'suggestions.actions.acceptTooltip'})}>
                <span>
                    <Button
                        variant="outlined"
                        startIcon={<CheckRoundedIcon/>}
                        onClick={() => void onResolve('ACCEPTED')}
                        disabled={resolving}
                        sx={{
                            height: 48,
                            px: 3.5,
                            borderRadius: '15px',
                            textTransform: 'none',
                            color: '#2F8F5B',
                            borderColor: '#8BC8A6',
                            bgcolor: '#FFFFFF',
                            fontWeight: 800,
                            '&:hover': {
                                borderColor: '#2F8F5B',
                                bgcolor: '#F2FBF6',
                            },
                            '&.Mui-disabled': {
                                color: '#8FBBA2',
                                borderColor: '#CDE6D7',
                                bgcolor: '#FFFFFF',
                            },
                        }}
                    >
                        {resolving
                            ? intl.formatMessage({id: 'suggestions.actions.saving'})
                            : intl.formatMessage({id: 'suggestions.actions.accept'})}
                    </Button>
                </span>
            </Tooltip>
        </Box>
    );
}