import {Box, Typography, Divider, Button} from '@mui/material';
import {Add} from '@mui/icons-material';
import {useIntl} from 'react-intl';

interface RoomViewProps {
    data: any[];
}

export default function RoomView({data}: RoomViewProps) {
    const intl = useIntl();

    return (
        <Box>
            {data.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    {intl.formatMessage({id: 'facilities.noData'})}
                </Typography>
            )}

            {data.map((item) => (
                <Box key={item.id}>
                    <Box sx={{display: 'flex', alignItems: 'center', py: 2}}>
                        <Box sx={{flexGrow: 1, display: 'flex', justifyContent: 'space-between'}}>
                            <Typography fontWeight={600}>{item.room_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item.room_capacity} {intl.formatMessage({id: 'facilities.seats'})}, {item.pc_amount} {intl.formatMessage({id: 'facilities.pcs'})}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider/>
                </Box>
            ))}

            <Button startIcon={<Add/>} sx={{mt: 2, color: 'text.secondary', textTransform: 'none', fontWeight: 500}}>
                {intl.formatMessage({id: 'facilities.addRoom'})}
            </Button>
        </Box>
    );
}