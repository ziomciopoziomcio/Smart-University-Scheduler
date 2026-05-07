import {Box, CircularProgress} from '@mui/material';

export function ChatTypingBubble() {
    return (
        <Box sx={{display: 'flex', justifyContent: 'flex-start', px: 1}}>
            <Box
                sx={{
                    position: 'relative',
                    px: 2.25,
                    py: 1.45,
                    borderRadius: '14px 14px 14px 4px',
                    bgcolor: '#0A9BD8',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.08)',

                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '-8px',
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        borderWidth: '8px 10px 0 0',
                        borderColor: 'transparent #0A9BD8 transparent transparent',
                    },
                }}
            >
                <CircularProgress size={16} color="inherit"/>
            </Box>
        </Box>
    );
}