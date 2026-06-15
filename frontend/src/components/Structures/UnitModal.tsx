import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, TextField, Box} from '@mui/material';
import {useIntl} from "react-intl";
import {type Unit, createUnit, updateUnit} from '@api';
import { AppButton } from '@components/Common';

interface UnitModalProps {
    open: boolean;
    facultyId: number;
    unit: Unit | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UnitModal({open, facultyId, unit, onClose, onSuccess}: UnitModalProps) {

    const intl = useIntl();
    const [name, setName] = useState('');
    const [short, setShort] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(unit?.unit_name || '');
        setShort(unit?.unit_short || '');
    }, [unit, open]);

    const handleSubmit = async () => {
        setLoading(true);
        const payload = {unit_name: name, unit_short: short, faculty_id: facultyId};
        try {
            if (unit) {
                await updateUnit(unit.id, payload);
            } else {
                await createUnit(payload);
            }
            onSuccess();
            onClose();
        } catch {
            alert(intl.formatMessage({id: 'structures.unit.errors.add'}));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', minWidth: 400}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>

                <Typography variant="h5"
                            fontWeight="bold"
                            textAlign="center">
                    {unit ?
                        intl.formatMessage({id: 'structures.unit.edit'}) :
                        intl.formatMessage({id: 'structures.unit.add'})
                    }
                </Typography>

                <TextField label={intl.formatMessage({id: 'structures.unit.nameLabel'})}
                           placeholder={intl.formatMessage({id: 'structures.unit.namePlaceholder'})}
                           value={name}
                           onChange={(e) => {
                               setName(e.target.value);
                           }}
                           fullWidth
                />
                <TextField label={intl.formatMessage({id: 'structures.unit.shortLabel'})}
                           placeholder={intl.formatMessage({id: 'structures.unit.shortPlaceholder'})}
                           value={short}
                           onChange={(e) => {
                               setShort(e.target.value);
                           }}
                           fullWidth
                />
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <AppButton variant="contained" onClick={() => {
                                void handleSubmit();
                            }} loading={loading} disabled={loading || !name || !short}>
                        {intl.formatMessage({id: 'structures.common.save'})}
                    </AppButton>
                    <AppButton variant="text" onClick={onClose} disabled={loading}>
                        {intl.formatMessage({id: 'structures.common.cancel'})}
                    </AppButton>
                </Box>
            </DialogContent>
        </Dialog>
    );
}