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
                                 }: {
    label: string;
    value: string;
    changed: boolean;
}) {
    const isMultiline = value.length > 60 || value.includes('\n');

    return (
        <TextField
            fullWidth
            multiline={isMultiline}
            minRows={isMultiline ? 2 : undefined}
            maxRows={isMultiline ? 10 : undefined}
            label={label}
            value={value || '—'}
            InputProps={{
                readOnly: true,
            }}
            InputLabelProps={{shrink: true}}
            sx={{
                '& .MuiOutlinedInput-root': {
                    alignItems: isMultiline ? 'flex-start' : 'center',
                    borderRadius: '16px',
                    bgcolor: changed ? '#FFF1F1' : '#FBFCFF',
                    color: changed ? '#A94444' : '#4F4F4F',
                    fontWeight: changed ? 700 : 500,
                    '& textarea, & input': {
                        fontFamily: isMultiline ? 'monospace' : 'inherit',
                        fontSize: isMultiline ? 13 : 'inherit',
                        lineHeight: isMultiline ? 1.5 : 'inherit',
                        whiteSpace: isMultiline ? 'pre-wrap' : 'normal',
                    },
                    '& fieldset': {
                        borderColor: changed ? '#D64545' : '#E1E5EF',
                        borderWidth: changed ? 2 : 1,
                    },
                    '&:hover fieldset': {
                        borderColor: changed ? '#D64545' : '#C8D0E0',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: changed ? '#D64545' : '#4F5E82',
                    },
                },
                '& .MuiInputLabel-root': {
                    color: changed ? '#A94444' : '#7A7A7A',
                    fontWeight: changed ? 700 : 600,
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
                alignItems: 'stretch',
            }}
        >
            <ReadonlySuggestionField
                label={field.beforeLabel ?? field.label}
                value={field.before}
                changed={changed}
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
                        color: changed ? '#D64545' : '#687085',
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
                label={field.afterLabel ?? field.label}
                value={field.after}
                changed={changed}
            />
        </Box>
    );
}
