import {Box, Divider, Paper, Typography} from '@mui/material';
import {useIntl} from 'react-intl';
import type {Chat} from '@api/domains/conversations';
import {ChatArchiveActions} from './ChatArchiveActions';
import {ChatArchiveSearch} from './ChatArchiveSearch';
import {ChatArchiveList} from './ChatArchiveList';

interface ChatArchivePanelProps {
    chats: Chat[];
    selectedChatId: number | null;
    search: string;
    isLoading: boolean;
    onSearchChange: (value: string) => void;
    onNewChat: () => void;
    onSelectChat: (chatId: number) => void;
    onDeleteChat: (chatId: number) => void;
}

export function ChatArchivePanel({
    chats,
    selectedChatId,
    search,
    isLoading,
    onSearchChange,
    onNewChat,
    onSelectChat,
    onDeleteChat,
}: ChatArchivePanelProps) {
    const intl = useIntl();

    return (
        <Paper
            elevation={0}
            sx={{
                display: {xs: 'none', md: 'flex'},
                flexDirection: 'column',
                // borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                bgcolor: '#FFFFFF',
            }}
        >
            <Box sx={{p: 2}}>
                <ChatArchiveActions onNewChat={onNewChat}/>

                <ChatArchiveSearch
                    value={search}
                    onChange={onSearchChange}
                />

                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{mt: 2.5, px: 0.5}}
                >
                    {intl.formatMessage({
                        id: 'chat.history',
                        defaultMessage: 'Historia rozmów',
                    })}
                </Typography>
            </Box>

            <Divider/>

            <Box sx={{flex: 1, overflowY: 'auto', px: 1, pb: 1}}>
                <ChatArchiveList
                    chats={chats}
                    search={search}
                    selectedChatId={selectedChatId}
                    isLoading={isLoading}
                    onSelectChat={onSelectChat}
                    onDeleteChat={onDeleteChat}
                />
            </Box>
        </Paper>
    );
}