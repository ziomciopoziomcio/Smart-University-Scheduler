import {Box, CircularProgress, List, Typography} from '@mui/material';
import {useMemo} from 'react';
import {useIntl} from 'react-intl';
import type {Chat} from '@api/domains/conversations';
import {ChatArchiveListItem} from './ChatArchiveListItem';

interface ChatArchiveListProps {
    chats: Chat[];
    search: string;
    selectedChatId: number | null;
    isLoading: boolean;
    onSelectChat: (chatId: number) => void;
    onDeleteChat: (chatId: number) => void;
}

export function ChatArchiveList({
    chats,
    search,
    selectedChatId,
    isLoading,
    onSelectChat,
    onDeleteChat,
}: ChatArchiveListProps) {
    const intl = useIntl();

    const filteredChats = useMemo(() => {
        const phrase = search.trim().toLowerCase();

        if (!phrase) return chats;

        return chats.filter((chat) =>
            (chat.title || '').toLowerCase().includes(phrase)
        );
    }, [chats, search]);

    if (isLoading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                <CircularProgress size={24}/>
            </Box>
        );
    }

    if (filteredChats.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{px: 2, py: 3}}>
                {intl.formatMessage({
                    id: 'chat.emptyHistory',
                    defaultMessage: 'Brak rozmów.',
                })}
            </Typography>
        );
    }

    return (
        <List disablePadding>
            {filteredChats.map((chat) => (
                <ChatArchiveListItem
                    key={chat.id}
                    chat={chat}
                    selected={chat.id === selectedChatId}
                    onSelect={onSelectChat}
                    onDelete={onDeleteChat}
                />
            ))}
        </List>
    );
}