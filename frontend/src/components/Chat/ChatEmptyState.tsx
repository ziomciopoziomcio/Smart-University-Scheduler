import {Box, Typography} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import {useIntl} from 'react-intl';

export function ChatEmptyState() {
    const intl = useIntl();

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'text.secondary',
            }}
        >
            <ChatBubbleOutlineIcon sx={{fontSize: 48, mb: 2}}/>

            <Typography variant="h6" fontWeight={700}>
                {intl.formatMessage({
                    id: 'chat.emptyTitle',
                    defaultMessage: 'Zacznij nową rozmowę',
                })}
            </Typography>

            <Typography variant="body2">
                {intl.formatMessage({
                    id: 'chat.emptyDescription',
                    defaultMessage: 'Zapytaj o plan, zmianę terminu albo dostępność zajęć.',
                })}
            </Typography>
        </Box>
    );
}