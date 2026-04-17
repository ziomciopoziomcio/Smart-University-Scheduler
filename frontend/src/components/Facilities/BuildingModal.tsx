import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, TextField, Box, Button, CircularProgress} from '@mui/material';
import {useIntl} from 'react-intl';
import {createBuilding, updateBuilding} from '@api/facilities';
import {type Building} from '@api/types';

interface BuildingModalProps {
    open: boolean;
    campusId: number;
    building?: Building | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BuildingModal({open, campusId, building, onClose, onSuccess}: BuildingModalProps) {
    const intl = useIntl();
    const [number, setNumber] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = Boolean(building);

    useEffect(() => {
        if (open) {
            setNumber(building?.building_number || '');
            setName(building?.building_name || '');
        }
    }, [open, building]);

    const handleSubmit = async () => {
        if (!number) return;
        setIsSubmitting(true);
        try {
            if (isEditMode && building) {
                await updateBuilding(building.id, {building_number: number, building_name: name || undefined});
            } else {
                await createBuilding({building_number: number, building_name: name || undefined, campus_id: campusId});
            }
            onSuccess();
            onClose();
        } catch {
            // TODO: snackbar maybe
            alert(intl.formatMessage({id: 'facilities.building.errors.add'}));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 400}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3, mt: 2}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    {intl.formatMessage({id: isEditMode ? 'facilities.building.edit' : 'facilities.building.edit'})}
                </Typography>

                <TextField
                    label={intl.formatMessage({id: 'facilities.building.numberLabel'})}
                    placeholder={intl.formatMessage({id: 'facilities.building.numberPlaceholder'})}
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <TextField
                    label={intl.formatMessage({id: 'facilities.building.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'facilities.building.namePlaceholder'})}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button variant="contained" fullWidth onClick={handleSubmit} disabled={isSubmitting || !number}
                            sx={{
                                py: 1.5,
                                borderRadius: '12px',
                                background: '#2b5073',
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {bgcolor: '#1a3a56'}
                            }}>
                        {isSubmitting ? <CircularProgress size={24}
                                                          color="inherit"/> : intl.formatMessage({id: isEditMode ? 'facilities.building.edit' : 'facilities.building.add'})}
                    </Button>
                    <Button variant="text" fullWidth onClick={onClose} disabled={isSubmitting}
                            sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}>
                        {intl.formatMessage({id: 'facilities.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}