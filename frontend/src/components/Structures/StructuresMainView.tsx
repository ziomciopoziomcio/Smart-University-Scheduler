import { Box, Typography, Paper } from '@mui/material';
import { AccountBalance, SchoolOutlined } from '@mui/icons-material';
import { useIntl } from 'react-intl';

interface StructuresMainViewProps {
    onNavigate: (view: 'faculties' | 'units') => void;
}

export default function StructuresMainView({ onNavigate }: StructuresMainViewProps) {
    const intl = useIntl();

    const tiles = [
        {
            id: 'faculties',
            title: intl.formatMessage({ id: 'structures.faculties' }),
            description: intl.formatMessage({ id: 'structures.facultiesDesc' }),
            icon: <AccountBalance sx={{ fontSize: 48, color: '#2b5073' }} />
        },
        {
            id: 'units',
            title: intl.formatMessage({ id: 'structures.units' }),
            description: intl.formatMessage({ id: 'structures.unitsDesc' }),
            icon: <SchoolOutlined sx={{ fontSize: 48, color: '#2b5073' }} />
        }
    ];

    return (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', mt: 4 }}>
            {tiles.map((tile) => (
                <Paper
                    key={tile.id}
                    onClick={() => onNavigate(tile.id as any)}
                    elevation={0}
                    sx={{
                        width: 300,
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        borderRadius: '24px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                            borderColor: '#2b5073'
                        }
                    }}
                >
                    <Box sx={{ mb: 2 }}>{tile.icon}</Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {tile.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {tile.description}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
}