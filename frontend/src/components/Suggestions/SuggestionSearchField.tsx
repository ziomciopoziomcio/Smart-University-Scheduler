import {type ChangeEvent} from 'react';
import {
    InputAdornment,
    TextField,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {useIntl} from 'react-intl';

interface SuggestionSearchFieldProps {
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function SuggestionSearchField({
                                          value,
                                          onChange,
                                      }: SuggestionSearchFieldProps) {
    const intl = useIntl();

    return (
        <TextField
            fullWidth
            size="small"
            value={value}
            onChange={onChange}
            placeholder={intl.formatMessage({id: 'suggestions.queue.searchPlaceholder'})}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchRoundedIcon sx={{fontSize: 20, color: '#8A94A8'}}/>
                    </InputAdornment>
                ),
            }}
            sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                    height: 42,
                    borderRadius: '14px',
                    bgcolor: '#FBFCFF',
                    color: '#4F4F4F',
                    fontWeight: 600,
                    '& fieldset': {
                        borderColor: '#E1E5EF',
                    },
                    '&:hover fieldset': {
                        borderColor: '#C8D0E0',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#4F5E82',
                    },
                },
                '& input::placeholder': {
                    color: '#9AA3B5',
                    opacity: 1,
                    fontWeight: 500,
                },
            }}
        />
    );
}