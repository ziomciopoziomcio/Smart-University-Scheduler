import {Box, IconButton, TextField} from '@mui/material';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {useIntl} from 'react-intl';

interface ChatComposerProps {
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onSend: () => void;
}

export function ChatComposer({
    value,
    disabled,
    onChange,
    onSend,
}: ChatComposerProps) {
    const intl = useIntl();

    return (
        <Box
            sx={{
                p: 2,
                bgcolor: '#FFFFFF',
                borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
        >
            <Box sx={{display: 'flex', gap: 1.5}}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={value}
                    placeholder={intl.formatMessage({
                        id: 'chat.placeholder',
                        defaultMessage: 'Napisz wiadomość...',
                    })}
                    onChange={(event) => {
                        onChange(event.target.value);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            onSend();
                        }
                    }}
                    InputProps={{
                        sx: {
                            borderRadius: 1,
                            bgcolor: '#F8FAFD',
                        },
                    }}
                />

                <IconButton
                    onClick={onSend}
                    disabled={!value.trim() || disabled}
                    sx={{
                        alignSelf: 'flex-end',
                        width: 52,
                        height: 52,
                        bgcolor: '#05668D',
                        color: '#FFFFFF',
                        '&:hover': {bgcolor: '#04577A'},
                        '&.Mui-disabled': {
                            bgcolor: '#D9E2E8',
                            color: '#7A8A95',
                        },
                    }}
                >
                    <SendOutlinedIcon/>
                </IconButton>
            </Box>
        </Box>
    );
}