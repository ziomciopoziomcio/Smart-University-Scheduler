import {IconButton, ListItemButton, ListItemText} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useIntl} from 'react-intl';
import type {Chat} from '@api/domains/conversations';

interface ChatArchiveListItemProps {
    chat: Chat;
    selected: boolean;
    onSelect: (chatId: number) => void;
    onDelete: (chatId: number) => void;
}

export function ChatArchiveListItem({
    chat,
    selected,
    onSelect,
    onDelete,
}: ChatArchiveListItemProps) {
    const intl = useIntl();

    return (
        <ListItemButton
            selected={selected}
            onClick={() => {
                onSelect(chat.id);
            }}
            sx={{
                borderRadius: 2,
                mb: 0.5,
                alignItems: 'flex-start',
                px: 1.5,
                py: 1,
                '&:hover': {
                    bgcolor: '#F5F7FA',
                },
                '&.Mui-selected': {
                    bgcolor: '#EEF3F7',
                },
                '&.Mui-selected:hover': {
                    bgcolor: '#E7EEF4',
                },
            }}
        >
            <ChatBubbleOutlineIcon
                sx={{
                    fontSize: 18,
                    mt: 0.35,
                    mr: 1,
                    color: 'text.secondary',
                }}
            />

            <ListItemText
                primary={
                    chat.title ||
                    intl.formatMessage({
                        id: 'chat.untitled',
                        defaultMessage: 'Bez tytułu',
                    })
                }
                primaryTypographyProps={{
                    noWrap: true,
                    fontSize: 14,
                    fontWeight: 600,
                }}
                secondary={new Date(chat.created_at).toLocaleDateString()}
                secondaryTypographyProps={{
                    fontSize: 12,
                }}
            />

            <IconButton
                size="small"
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete(chat.id);
                }}
            >
                <DeleteOutlineIcon fontSize="small"/>
            </IconButton>
        </ListItemButton>
    );
}