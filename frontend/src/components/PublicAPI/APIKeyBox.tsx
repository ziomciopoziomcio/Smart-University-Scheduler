import {Box, Typography, Tooltip, IconButton} from '@mui/material';
import {ContentCopy} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useTheme} from '@mui/material/styles';

interface APIKeyBoxProps {
    apiKey: string | null;
}

export const APIKeyBox = ({apiKey}: APIKeyBoxProps) => {
    const intl = useIntl();
    const theme = useTheme();

    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey).catch(() => { /* ignore */ });
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: '100%',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
            p: 2,
            borderRadius: '12px',
            border: '1px dashed',
            borderColor: 'divider'
        }}>
            <Typography sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                flexGrow: 1,
                wordBreak: 'break-all',
                letterSpacing: '0.5px',
                fontSize: '0.95rem'
            }}>
                {apiKey}
            </Typography>
            <Tooltip title={intl.formatMessage({id: 'users.modal.copyTooltip'})}>
                <IconButton onClick={copyToClipboard} color="primary">
                    <ContentCopy fontSize="small"/>
                </IconButton>
            </Tooltip>
        </Box>
    );
};
