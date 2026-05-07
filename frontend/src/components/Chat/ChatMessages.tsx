import {Box, CircularProgress} from '@mui/material';
import {useEffect, useRef} from 'react';
import type {ChatMessage} from '@api/domains/conversations';
import {ChatEmptyState} from './ChatEmptyState';
import {ChatMessageBubble} from './ChatMessageBubble';
import {ChatTypingBubble} from './ChatTypingBubble';

interface ChatMessagesProps {
    messages: ChatMessage[];
    isLoading: boolean;
    isSending: boolean;
}

export function ChatMessages({messages, isLoading, isSending}: ChatMessagesProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages, isSending]);

    if (isLoading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (messages.length === 0) {
        return <ChatEmptyState/>;
    }

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2.2}}>
            {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message}/>
            ))}

            {isSending && <ChatTypingBubble/>}

            <div ref={bottomRef}/>
        </Box>
    );
}