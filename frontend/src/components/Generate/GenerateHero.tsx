import {Box, Button, Paper, Typography} from '@mui/material';
import {AutoAwesomeOutlined} from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {useIntl} from 'react-intl';

import {theme} from '../../theme/theme.ts';

interface GenerateHeroProps {
    onGenerate: () => Promise<void>;
    isGenerating: boolean;
}

export default function GenerateHero({onGenerate, isGenerating}: GenerateHeroProps) {
    const intl = useIntl();

    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 3.5, md: 5},
                minHeight: {xs: 240, md: 220},
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 14px 34px rgba(20, 30, 55, 0.07)',
                display: 'flex',
                alignItems: {xs: 'stretch', md: 'center'},
                justifyContent: 'space-between',
                gap: {xs: 3.5, md: 5},
                flexDirection: {xs: 'column', md: 'row'},
            }}
        >
            <Box sx={{display: 'flex', alignItems: 'center', gap: {xs: 6, md: 8}, flex: 1}}>
                <CalendarTodayIcon
                    sx={{
                        fontSize: {xs: 70, md: 92},
                        color: '#A8ADB7',
                        flexShrink: 0,
                    }}
                />

                <Box sx={{textAlign: 'left', width: '100%', maxWidth: 720}}>
                    <Typography
                        sx={{
                            fontSize: {xs: 30, md: 40},
                            fontWeight: 700,
                            color: '#4F4F4F',
                            lineHeight: 1.1,
                            textAlign: 'left',
                        }}
                    >
                        {intl.formatMessage({id: 'generateSchedule.hero.title'})}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 1.4,
                            fontSize: {xs: 15, md: 16.5},
                            color: '#7A7A7A',
                            maxWidth: 700,
                            lineHeight: 1.6,
                            textAlign: 'left',
                        }}
                    >
                        {intl.formatMessage({id: 'generateSchedule.hero.description'})}
                    </Typography>
                </Box>
            </Box>

            <Button
                size="large"
                variant="contained"
                startIcon={<AutoAwesomeOutlined/>}
                onClick={() => void onGenerate()}
                disabled={isGenerating}
                sx={{
                    px: {xs: 4, md: 6},
                    py: {xs: 1.9, md: 2.25},
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontSize: {xs: 17, md: 19},
                    minWidth: {xs: '100%', md: 280},
                    minHeight: 76,
                    background: theme.palette.gradients.brand,
                    color: '#FFFFFF',
                    boxShadow: '0 16px 30px rgba(79, 94, 130, 0.30)',
                    '&:hover': {
                        background: theme.palette.gradients.brand,
                        filter: 'brightness(0.96)',
                        boxShadow: '0 18px 34px rgba(79, 94, 130, 0.36)',
                    },
                    '&.Mui-disabled': {
                        color: '#FFFFFF',
                        opacity: 0.65,
                    },
                }}
            >
                {isGenerating
                    ? intl.formatMessage({id: 'generateSchedule.hero.generating'})
                    : intl.formatMessage({id: 'generateSchedule.hero.button'})}
            </Button>
        </Paper>
    );
}