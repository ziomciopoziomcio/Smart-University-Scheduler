import {Box, Typography} from '@mui/material';
import {useIntl} from 'react-intl';
import type {Chat} from '@api/domains/conversations';

interface ChatConversationHeaderProps {
    selectedChat: Chat | null;
}

export function ChatConversationHeader({selectedChat}: ChatConversationHeaderProps) {
    const intl = useIntl();

    return (
        <Box
            sx={{
                px: 3,
                py: 2,
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                bgcolor: '#FFFFFF',
            }}
        >
            <Typography variant="h6" fontWeight={700}>
                {selectedChat?.title ||
                    intl.formatMessage({
                        id: 'chat.title',
                        defaultMessage: 'Chat',
                    })}
            </Typography>

            <Typography variant="body2" color="text.secondary">
                {intl.formatMessage({
                    id: 'chat.subtitle',
                    defaultMessage: 'Asystent planu zajęć',
                })}
            </Typography>
        </Box>
    );
}