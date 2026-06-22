import {Box, Typography, Paper, Alert} from '@mui/material';
import {Tag} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {AppButton} from '@components/Common';
import {useTheme} from '@mui/material/styles';

interface APIKeyGeneratorCardProps {
    onGenerate: () => void;
    loading: boolean;
    error: string | null;
}

export const APIKeyGeneratorCard = ({onGenerate, loading, error}: APIKeyGeneratorCardProps) => {
    const intl = useIntl();
    const theme = useTheme();

    return (
        <Paper sx={{p: 4, borderRadius: '24px'}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
                <Box sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: theme.palette.primary.main + '15',
                    color: theme.palette.primary.main
                }}>
                    <Tag fontSize="large" />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        {intl.formatMessage({id: 'publicapi.title'})}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {intl.formatMessage({id: 'publicapi.description'})}
                    </Typography>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{mb: 3, borderRadius: '12px'}}>
                    {error}
                </Alert>
            )}

            <Box sx={{mt: 4}}>
                <AppButton
                    variant="contained"
                    onClick={onGenerate}
                    loading={loading}
                    startIcon={<Tag />}
                    sx={{px: 4}}
                >
                    {intl.formatMessage({id: 'publicapi.generateButton'})}
                </AppButton>
            </Box>
        </Paper>
    );
};
