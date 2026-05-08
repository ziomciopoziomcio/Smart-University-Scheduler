import {Box, TextField} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {useIntl} from 'react-intl';

interface ChatArchiveSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function ChatArchiveSearch({value, onChange}: ChatArchiveSearchProps) {
    const intl = useIntl();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 0.8,
                mt: 0.5,
                borderRadius: 1,
                bgcolor: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
            }}
        >
            <SearchOutlinedIcon sx={{fontSize: 22, color: '#1F1F1F'}}/>

            <TextField
                variant="standard"
                fullWidth
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
                placeholder={intl.formatMessage({
                    id: 'chat.searchChats',
                    defaultMessage: 'Search chats',
                })}
                InputProps={{
                    disableUnderline: true,
                    sx: {
                        fontSize: 16,
                    },
                }}
            />
        </Box>
    );
}