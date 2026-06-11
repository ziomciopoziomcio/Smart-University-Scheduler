import {useState, useEffect} from 'react';
import {Box, Typography} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {AccessTimeFilled} from '@mui/icons-material';
import {useIntl} from 'react-intl';

export default function SidebarClock({open}: { open: boolean }) {
    const intl = useIntl();
    const theme = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => {
            clearInterval(timer)
        };
    }, [open]);

    if (!open) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', width: '100%'}}>
                <AccessTimeFilled sx={{fontSize: 22, color: theme.palette.text.secondary}}/>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            background: theme.palette.background.paper,
            p: '10px 15px',
            borderRadius: '16px',
            width: '100%',
            boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                : '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
            <AccessTimeFilled sx={{fontSize: 24, color: theme.palette.primary.main}}/>
            <Typography variant="caption" sx={{fontWeight: 600, lineHeight: 1.2, color: theme.palette.text.primary}}>
                {intl.formatDate(currentTime, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}
                <br/>
                {intl.formatTime(currentTime, {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </Typography>
        </Box>
    );
}