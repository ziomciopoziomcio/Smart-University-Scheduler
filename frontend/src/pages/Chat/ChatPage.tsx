import {useEffect, useMemo, useState} from 'react';
import {Box} from '@mui/material';
import {useIntl} from 'react-intl';

import {ChatArchivePanel, ChatConversationPanel} from '@components/Chat';

import {
    type Chat,
    type ChatMessage,
    createChat,
    deleteChat,
    fetchChatMessages,
    fetchChats,
    sendChatMessage,
} from '@api/domains/conversations';

export default function ChatPage() {
    const intl = useIntl();

    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [chatSearch, setChatSearch] = useState('');

    const [isChatsLoading, setIsChatsLoading] = useState(true);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const selectedChat = useMemo(
        () => chats.find((chat) => chat.id === selectedChatId) ?? null,
        [chats, selectedChatId]
    );

    const loadChats = async (selectFirst = true) => {
        setIsChatsLoading(true);

        try {
            const result = await fetchChats(1, 50);

            setChats(result.items);

            if (selectFirst) {
                setSelectedChatId((currentSelectedChatId) => {
                    if (currentSelectedChatId) {
                        const stillExists = result.items.some((chat) => chat.id === currentSelectedChatId);
                        if (stillExists) return currentSelectedChatId;
                    }

                    return result.items[0]?.id ?? null;
                });
            }
        } finally {
            setIsChatsLoading(false);
        }
    };

    const loadMessages = async (chatId: number) => {
        setIsMessagesLoading(true);

        try {
            const result = await fetchChatMessages(chatId, 1, 100);
            setMessages(result.items);
        } finally {
            setIsMessagesLoading(false);
        }
    };

    useEffect(() => {
        void loadChats();
    }, []);

    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }

        void loadMessages(selectedChatId);
    }, [selectedChatId]);

    const handleNewChat = async () => {
        const chat = await createChat(
            intl.formatMessage({
                id: 'chat.newChatTitle',
                defaultMessage: 'Nowy czat',
            })
        );

        setChats((prev) => [chat, ...prev]);
        setSelectedChatId(chat.id);
        setMessages([]);
        setInput('');
    };

    const handleDeleteChat = async (chatId: number) => {
        await deleteChat(chatId);

        setChats((prev) => {
            const next = prev.filter((chat) => chat.id !== chatId);

            if (selectedChatId === chatId) {
                setSelectedChatId(next[0]?.id ?? null);
            }

            return next;
        });
    };

    const handleSend = async () => {
        const content = input.trim();

        if (!content || isSending) return;

        let chatId = selectedChatId;

        if (!chatId) {
            const chat = await createChat(content.slice(0, 48));

            setChats((prev) => [chat, ...prev]);
            setSelectedChatId(chat.id);

            chatId = chat.id;
        }

        setInput('');
        setIsSending(true);

        const optimisticUserMessage: ChatMessage = {
            id: Date.now(),
            chat_id: chatId,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticUserMessage]);

        try {
            const response = await sendChatMessage(chatId, content);

            setMessages((prev) => [
                ...prev.filter((message) => message.id !== optimisticUserMessage.id),
                response.user_message,
                response.ai_message,
            ]);

            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === chatId && (!chat.title || chat.title === 'Nowy czat' || chat.title === 'New chat')
                        ? {...chat, title: content.slice(0, 48)}
                        : chat
                )
            );
        } catch (error) {
            setMessages((prev) => prev.filter((message) => message.id !== optimisticUserMessage.id));
            console.error('Nie udało się wysłać wiadomości:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {xs: '1fr', md: '280px 1fr'},
                gap: 2,
                width: '100%',
                minHeight: 'calc(100vh - 120px)',
                pr: 2,
            }}
        >
            <ChatArchivePanel
                chats={chats}
                selectedChatId={selectedChatId}
                search={chatSearch}
                isLoading={isChatsLoading}
                onSearchChange={setChatSearch}
                onNewChat={() => {
                    void handleNewChat();
                }}
                onSelectChat={setSelectedChatId}
                onDeleteChat={(chatId) => {
                    void handleDeleteChat(chatId);
                }}
            />

            <ChatConversationPanel
                selectedChat={selectedChat}
                messages={messages}
                input={input}
                isMessagesLoading={isMessagesLoading}
                isSending={isSending}
                onInputChange={setInput}
                onSend={() => {
                    void handleSend();
                }}
            />
        </Box>
    );
}