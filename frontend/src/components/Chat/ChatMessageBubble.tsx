import {Box, Typography} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import type {ChatMessage} from '@api/domains/conversations';

interface ChatMessageBubbleProps {
    message: ChatMessage;
}

export function ChatMessageBubble({message}: ChatMessageBubbleProps) {
    const theme = useTheme();
    const isUser = message.role === 'user';

    const bubbleColor = isUser ? theme.palette.primary.main : theme.palette.primary.light;
    const textColor = isUser ? theme.palette.primary.contrastText : theme.palette.primary.contrastText;

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                px: 1,
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    maxWidth: {xs: '92%', md: '68%'},
                    px: 2.25,
                    py: 1.45,
                    bgcolor: bubbleColor,
                    color: textColor,
                    boxShadow: theme.palette.mode === 'dark' 
                        ? '0 8px 24px rgba(0,0,0,0.3)' 
                        : '0 8px 18px rgba(0,0,0,0.08)',
                    borderRadius: isUser
                        ? '14px 14px 4px 14px'
                        : '14px 14px 14px 4px',

                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        ...(isUser
                            ? {
                                right: '-8px',
                                borderWidth: '8px 0 0 10px',
                                borderColor: `transparent transparent transparent ${bubbleColor}`,
                            }
                            : {
                                left: '-8px',
                                borderWidth: '8px 10px 0 0',
                                borderColor: `transparent ${bubbleColor} transparent transparent`,
                            }),
                    },
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.55,
                        fontWeight: 500
                    }}
                >
                    {message.content}
                </Typography>
            </Box>
        </Box>
    );
}