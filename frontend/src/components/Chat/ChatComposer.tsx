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
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
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
                    slotProps={{
                        input: {
                            sx: {
                                borderRadius: 1,
                                bgcolor: 'background.default',
                            },
                        }
                    }}
                />

                <IconButton
                    onClick={onSend}
                    disabled={!value.trim() || disabled}
                    sx={{
                        alignSelf: 'flex-end',
                        width: 52,
                        height: 52,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                        },
                        '&.Mui-disabled': {
                            bgcolor: 'action.disabledBackground',
                            color: 'action.disabled',
                        },
                    }}
                >
                    <SendOutlinedIcon/>
                </IconButton>
            </Box>
        </Box>
    );
}