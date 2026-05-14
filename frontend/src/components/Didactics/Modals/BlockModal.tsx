import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, Typography, Button, Box,
    TextField, Alert, CircularProgress
} from '@mui/material';
import {useIntl} from 'react-intl';
import {type ElectiveBlock, createElectiveBlock, updateElectiveBlock} from '@api';

interface BlockModalProps {
    open: boolean;
    block: ElectiveBlock | null;
    fieldId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function BlockModal({open, block, fieldId, onClose, onSuccess}: BlockModalProps) {
    const intl = useIntl();
    const isEdit = Boolean(block);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(block?.elective_block_name || '');
            setError(null);
        }
    }, [open, block]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError(intl.formatMessage({id: 'didactics.common.errorRequired'}));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isEdit && block) {
                await updateElectiveBlock(block.id, {elective_block_name: name.trim()});
            } else {
                await createElectiveBlock({
                    elective_block_name: name.trim(),
                    study_field: fieldId
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || intl.formatMessage({id: 'didactics.common.errorSave'}));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 400}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3, mt: 2}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    {intl.formatMessage({id: isEdit ? 'didactics.blocks.edit' : 'didactics.blocks.add'})}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label={intl.formatMessage({id: 'didactics.blocks.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'didactics.blocks.namePlaceholder'})}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    InputProps={{sx: {borderRadius: '12px'}}}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={loading || !name.trim()}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            background: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': {bgcolor: '#1a3a56'}
                        }}
                    >
                        {loading ?
                            <CircularProgress size={24} color="inherit"/> :
                            intl.formatMessage({id: isEdit ? 'didactics.common.saveChanges' : 'didactics.blocks.add'})
                        }
                    </Button>
                    <Button
                        variant="text"
                        fullWidth
                        onClick={onClose}
                        disabled={loading}
                        sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}
                    >
                        {intl.formatMessage({id: 'didactics.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}