import {useEffect, useMemo, useState} from 'react';
import {Box} from '@mui/material';
import {useIntl} from 'react-intl';

import {ChatArchivePanel, ChatConversationPanel} from '@components/chat';

import type {PaginatedResponse} from '@api/core';
import {
    type Chat,
    type ChatMessage,
    type ChatTurnResponse,
} from '@api/domains/conversations';

// TODO BACKEND:
// import {
//     createChat,
//     deleteChat,
//     fetchChatMessages,
//     fetchChats,
//     sendChatMessage,
// } from '@api/domains/conversations';

const MOCK_DELAY = 300;
const MOCK_USER_ID = 1;

let mockChats: Chat[] = [
    {
        id: 1,
        user_id: MOCK_USER_ID,
        title: 'Czy mogę przełożyć Programowanie Sieciowe?',
        created_at: new Date().toISOString(),
    },
    {
        id: 2,
        user_id: MOCK_USER_ID,
        title: 'O której godzinie konsultacje?',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
];

let mockMessages: Record<number, ChatMessage[]> = {
    1: [
        {
            id: 1,
            chat_id: 1,
            role: 'user',
            content: 'Czy mogę przełożyć Programowanie Sieciowe?',
            created_at: new Date().toISOString(),
        },
        {
            id: 2,
            chat_id: 1,
            role: 'assistant',
            content: 'Mogę pomóc sprawdzić możliwe terminy. Wybierz proszę zajęcia i preferowany dzień.',
            created_at: new Date().toISOString(),
        },
    ],
    2: [
        {
            id: 3,
            chat_id: 2,
            role: 'user',
            content: 'O której godzinie są konsultacje?',
            created_at: new Date().toISOString(),
        },
        {
            id: 4,
            chat_id: 2,
            role: 'assistant',
            content: 'Sprawdzę to w Twoim planie, gdy endpoint będzie podłączony.',
            created_at: new Date().toISOString(),
        },
    ],
};

const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

function toPaginatedResponse<T>(
    items: T[],
    page = 1,
    limit = 50
): PaginatedResponse<T> {
    const offset = (page - 1) * limit;

    return {
        items: items.slice(offset, offset + limit),
        total: items.length,
        limit,
        offset,
    };
}

async function mockFetchChats(
    page = 1,
    limit = 50
): Promise<PaginatedResponse<Chat>> {
    await wait();

    // TODO BACKEND:
    // ZAMIANA NA BACKEND:
    // return fetchChats(page, limit);

    const sortedChats = [...mockChats].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return toPaginatedResponse(sortedChats, page, limit);
}

async function mockCreateChat(title?: string | null): Promise<Chat> {
    await wait();

    // TODO BACKEND:
    // ZAMIANA NA BACKEND:
    // return createChat(title);

    const chat: Chat = {
        id: Date.now(),
        user_id: MOCK_USER_ID,
        title: title || 'Nowy czat',
        created_at: new Date().toISOString(),
    };

    mockChats = [chat, ...mockChats];
    mockMessages[chat.id] = [];

    return chat;
}

async function mockDeleteChat(chatId: number): Promise<void> {
    await wait();

    // TODO BACKEND:
    // ZAMIANA NA BACKEND:
    // return deleteChat(chatId);

    mockChats = mockChats.filter((chat) => chat.id !== chatId);
    delete mockMessages[chatId];
}

async function mockFetchChatMessages(
    chatId: number,
    page = 1,
    limit = 100
): Promise<PaginatedResponse<ChatMessage>> {
    await wait();

    // TODO BACKEND:
    // ZAMIANA NA BACKEND:
    // return fetchChatMessages(chatId, page, limit);

    const messages = mockMessages[chatId] || [];

    return toPaginatedResponse(messages, page, limit);
}

async function mockSendChatMessage(
    chatId: number,
    content: string
): Promise<ChatTurnResponse> {
    await wait();

    // TODO BACKEND:
    // ZAMIANA NA BACKEND:
    // return sendChatMessage(chatId, content);

    const now = new Date().toISOString();

    const userMessage: ChatMessage = {
        id: Date.now(),
        chat_id: chatId,
        role: 'user',
        content,
        created_at: now,
    };

    const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        chat_id: chatId,
        role: 'assistant',
        content: 'To jest tymczasowa odpowiedź. Tutaj później podepniesz endpoint AI chatu.',
        created_at: new Date().toISOString(),
    };

    mockMessages[chatId] = [...(mockMessages[chatId] || []), userMessage, aiMessage];

    mockChats = mockChats.map((chat) =>
        chat.id === chatId && (!chat.title || chat.title === 'Nowy czat')
            ? {...chat, title: content.slice(0, 48)}
            : chat
    );

    return {
        user_message: userMessage,
        ai_message: aiMessage,
    };
}

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

    useEffect(() => {
        const loadChats = async () => {
            setIsChatsLoading(true);

            try {
                const result = await mockFetchChats(1, 50);

                // TODO BACKEND:
                // Po przełączeniu na backend zostaje tak samo,
                // bo backend też zwraca PaginatedResponse<Chat>.
                setChats(result.items);

                if (result.items.length > 0) {
                    setSelectedChatId(result.items[0].id);
                }
            } finally {
                setIsChatsLoading(false);
            }
        };

        void loadChats();
    }, []);

    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedChatId) {
                setMessages([]);
                return;
            }

            setIsMessagesLoading(true);

            try {
                const result = await mockFetchChatMessages(selectedChatId, 1, 100);

                // TODO BACKEND:
                // Po przełączeniu na backend zostaje tak samo,
                // bo backend też zwraca PaginatedResponse<ChatMessage>.
                setMessages(result.items);
            } finally {
                setIsMessagesLoading(false);
            }
        };

        void loadMessages();
    }, [selectedChatId]);

    const handleNewChat = async () => {
        const chat = await mockCreateChat(
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
        await mockDeleteChat(chatId);

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
            const chat = await mockCreateChat(content.slice(0, 48));
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
            const response = await mockSendChatMessage(chatId, content);

            setMessages((prev) => [
                ...prev.filter((message) => message.id !== optimisticUserMessage.id),
                response.user_message,
                response.ai_message,
            ]);

            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === chatId && (!chat.title || chat.title === 'Nowy czat')
                        ? {...chat, title: content.slice(0, 48)}
                        : chat
                )
            );
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