// src/components/Facilities/Views/BuildingView.tsx
import { Box, Typography, Divider, Button } from '@mui/material';
import { ChevronRight, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';

interface BuildingViewProps {
    data: any[];
}

export default function BuildingView({ data }: BuildingViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            {data.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    {intl.formatMessage({ id: 'facilities.noData' })}
                </Typography>
            )}

            {data.map((item) => (
                <Box key={item.id}>
                    <Box
                        onClick={() => navigate(`/facilities/building/${item.id}`)}
                        sx={{
                            display: 'flex', alignItems: 'center', py: 2, cursor: 'pointer',
                            '&:hover': { bgcolor: '#fbfbfb' }
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography fontWeight={600}>
                                {intl.formatMessage({ id: 'facilities.breadcrumbs.building' })} {item.building_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {item.building_name || intl.formatMessage({ id: 'facilities.noName' })}
                            </Typography>
                        </Box>
                        <ChevronRight color="action" />
                    </Box>
                    <Divider />
                </Box>
            ))}

            <Button startIcon={<Add />} sx={{ mt: 2, color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}>
                {intl.formatMessage({ id: 'facilities.addBuilding' })}
            </Button>
        </Box>
    );
}