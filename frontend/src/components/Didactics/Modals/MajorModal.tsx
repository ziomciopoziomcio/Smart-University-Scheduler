import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, Typography, Box,
    TextField, Alert
} from '@mui/material';
import { useIntl } from 'react-intl';
import { type Major, createMajor, updateMajor } from '@api';
import { AppButton } from '@components/Common';

interface MajorModalProps {
    open: boolean;
    major: Major | null;
    fieldId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function MajorModal({ open, major, fieldId, onClose, onSuccess }: MajorModalProps) {
    const intl = useIntl();
    const isEdit = Boolean(major);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(major?.major_name || '');
            setError(null);
        }
    }, [open, major]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError(intl.formatMessage({id: 'didactics.common.errorRequired'}));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isEdit && major) {
                await updateMajor(major.id, { major_name: name.trim() });
            } else {
                await createMajor({
                    major_name: name.trim(),
                    study_field: fieldId
                });
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : intl.formatMessage({id: 'didactics.common.errorSave'});
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '24px', p: 1, minWidth: 400 } }}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
                    {intl.formatMessage({id: isEdit ? 'didactics.majors.edit' : 'didactics.majors.add'})}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label={intl.formatMessage({id: 'didactics.majors.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'didactics.majors.namePlaceholder'})}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    InputProps={{ sx: { borderRadius: '12px' } }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    <AppButton variant="contained" onClick={handleSubmit} loading={loading} disabled={loading || !name.trim()}>
                        {intl.formatMessage({id: isEdit ? 'didactics.common.saveChanges' : 'didactics.majors.add'})}
                    </AppButton>
                    <AppButton variant="text" onClick={onClose} disabled={loading}>
                        {intl.formatMessage({id: 'didactics.common.cancel'})}
                    </AppButton>
                </Box>
            </DialogContent>
        </Dialog>
    );
}