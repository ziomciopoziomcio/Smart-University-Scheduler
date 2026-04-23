import {useState, useEffect} from 'react';
import {Dialog, DialogContent, Typography, Box, Button, CircularProgress, TextField} from '@mui/material';
import {useIntl} from 'react-intl';
import {createRole, updateRole, type Role} from '@api';

interface RoleModalProps {
    open: boolean;
    role: Role | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function RoleModal({open, role, onClose, onSuccess}: RoleModalProps) {
    const intl = useIntl();
    const isEditMode = Boolean(role);

    const [roleName, setRoleName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setRoleName(role ? role.role_name : '');
        }
    }, [open, role]);

    const handleSubmit = async () => {
        if (!roleName.trim()) return;
        setIsSubmitting(true);
        try {
            if (isEditMode && role) {
                await updateRole(role.id, {role_name: roleName});
            } else {
                await createRole({role_name: roleName, permissions: []});
            }
            onSuccess();
            onClose();
        } catch {
            alert(intl.formatMessage({id: 'roles.errors.save'}));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{sx: {borderRadius: '24px', p: 1, minWidth: 400}}}>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {intl.formatMessage({id: isEditMode ? 'roles.titleEdit' : 'roles.titleAdd'})}
                </Typography>

                <TextField
                    fullWidth
                    label={intl.formatMessage({id: 'roles.nameLabel'})}
                    value={roleName}
                    onChange={(e) => {
                        setRoleName(e.target.value);
                    }}
                    disabled={isSubmitting}
                    autoFocus
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
                    <Button
                        variant="contained" fullWidth onClick={() => {
                        void handleSubmit();
                    }}
                        disabled={isSubmitting || !roleName.trim()}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            bgcolor: '#2b5073',
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24}
                                                          color="inherit"/> : intl.formatMessage({id: 'users.common.save'})}
                    </Button>
                    <Button variant="text" fullWidth onClick={onClose} disabled={isSubmitting}
                            sx={{color: '#2b5073', textTransform: 'none', fontWeight: 600}}>
                        {intl.formatMessage({id: 'users.common.cancel'})}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}