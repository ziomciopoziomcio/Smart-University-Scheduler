import {useState, useEffect} from 'react';
import {Box, Typography} from '@mui/material';
import {AccessTimeFilled} from '@mui/icons-material';
import {useIntl} from 'react-intl';

export default function SidebarClock({open}: { open: boolean }) {
    const intl = useIntl();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!open) {
            return;
        }

        setCurrentTime(new Date());

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
                <AccessTimeFilled sx={{fontSize: 22, color: '#333'}}/>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            background: 'white',
            p: '10px 15px',
            borderRadius: '16px',
            width: '100%',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
            <AccessTimeFilled sx={{fontSize: 24, color: '#1a1a1a'}}/>
            <Typography variant="caption" sx={{fontWeight: 600, lineHeight: 1.2, color: '#1a1a1a'}}>
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