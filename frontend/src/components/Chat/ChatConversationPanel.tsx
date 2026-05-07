import {Box, Paper} from '@mui/material';
import type {Chat, ChatMessage} from '@api/domains/conversations';
import {ChatConversationHeader} from './ChatConversationHeader';
import {ChatMessages} from './ChatMessages';
import {ChatComposer} from './ChatComposer';

interface ChatConversationPanelProps {
    selectedChat: Chat | null;
    messages: ChatMessage[];
    input: string;
    isMessagesLoading: boolean;
    isSending: boolean;
    onInputChange: (value: string) => void;
    onSend: () => void;
}

export function ChatConversationPanel({
                                          selectedChat,
                                          messages,
                                          input,
                                          isMessagesLoading,
                                          isSending,
                                          onInputChange,
                                          onSend,
                                      }: ChatConversationPanelProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'calc(100vh - 120px)',
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.06)',
                bgcolor: '#F8FAFD',
                overflow: 'hidden',
            }}
        >
            <ChatConversationHeader selectedChat={selectedChat}/>

            <Box
                sx={{
                    flex: 1,
                    p: {xs: 2, md: 4},
                    overflowY: 'auto',
                }}
            >
                <ChatMessages
                    messages={messages}
                    isLoading={isMessagesLoading}
                    isSending={isSending}
                />
            </Box>

            <ChatComposer
                value={input}
                disabled={isSending}
                onChange={onInputChange}
                onSend={onSend}
            />
        </Paper>
    );
}