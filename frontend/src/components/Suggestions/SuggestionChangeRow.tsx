import {
    Box,
    TextField,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import {
    type SuggestionField,
} from './suggestionUtils';

function ReadonlySuggestionField({
                                     label,
                                     value,
                                     changed,
                                     variant,
                                 }: {
    label: string;
    value: string;
    changed: boolean;
    variant: 'before' | 'after';
}) {
    const isAfter = variant === 'after';

    return (
        <TextField
            fullWidth
            label={label}
            value={value || '—'}
            InputProps={{
                readOnly: true,
            }}
            InputLabelProps={{shrink: true}}
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: changed && isAfter ? '#e1e6ed' : '#FBFCFF',
                    color: '#4F4F4F',
                    fontWeight: changed && isAfter ? 700 : 500,
                    '& fieldset': {
                        borderColor: changed && isAfter ? '#03557e' : '#E1E5EF',
                        borderWidth: changed && isAfter ? 2 : 1,
                    },
                    '&:hover fieldset': {
                        borderColor: changed && isAfter ? '#03557e' : '#C8D0E0',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: changed && isAfter ? '#03557e' : '#4F5E82',
                    },
                },
                '& .MuiInputLabel-root': {
                    color: changed && isAfter ? '#03557e' : '#7A7A7A',
                    fontWeight: changed && isAfter ? 700 : 600,
                },
            }}
        />
    );
}

export function SuggestionChangeRow({field}: { field: SuggestionField }) {
    const changed = field.before !== field.after;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {xs: '1fr', md: 'minmax(0, 1fr) 44px minmax(0, 1fr)'},
                gap: {xs: 1.2, md: 1.5},
                alignItems: 'center',
            }}
        >
            <ReadonlySuggestionField
                label={field.label}
                value={field.before}
                changed={changed}
                variant="before"
            />

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: {xs: 24, md: 56},
                    transform: {xs: 'rotate(90deg)', md: 'none'},
                }}
            >
                <Box
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '999px',
                        color: changed ? '#03557e' : '#687085',
                        opacity: changed ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ArrowForwardRoundedIcon sx={{fontSize: 20}}/>
                </Box>
            </Box>

            <ReadonlySuggestionField
                label={field.label}
                value={field.after}
                changed={changed}
                variant="after"
            />
        </Box>
    );
}