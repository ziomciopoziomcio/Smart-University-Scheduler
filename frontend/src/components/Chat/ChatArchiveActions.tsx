import {Box, Typography} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {useIntl} from 'react-intl';

interface ChatArchiveActionsProps {
    onNewChat: () => void;
}

export function ChatArchiveActions({onNewChat}: ChatArchiveActionsProps) {
    const intl = useIntl();

    return (
        <Box
            onClick={onNewChat}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.2,
                borderRadius: 2,
                cursor: 'pointer',
                transition: '0.2s',
                '&:hover': {
                    bgcolor: 'background.highlight',
                },
            }}
        >
            <EditOutlinedIcon sx={{fontSize: 22, color: 'text.primary'}}/>

            <Typography
                variant="body1"
                sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                }}
            >
                {intl.formatMessage({
                    id: 'chat.newChat',
                    defaultMessage: 'New chat',
                })}
            </Typography>
        </Box>
    );
}