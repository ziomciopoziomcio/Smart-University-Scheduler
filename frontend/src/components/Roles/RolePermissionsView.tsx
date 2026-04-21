import {useState, useEffect} from 'react';
import {Box, Typography, CircularProgress, Switch, Button, Snackbar, Alert} from '@mui/material';
import {useIntl} from 'react-intl';
import {type Role, type Permission} from '@api/types';
import {updateRolePermissions} from '@api/users';

interface RolePermissionsViewProps {
    role: Role;
    allPermissions: Permission[];
}

export default function RolePermissionsView({role, allPermissions}: RolePermissionsViewProps) {
    const intl = useIntl();

    const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (role) {
            setSelectedPermIds(role.permissions.map(p => p.id));
        }
    }, [role]);

    const handleToggle = (permId: number) => {
        setSelectedPermIds(prev =>
            prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
        );
    };

    const handleSavePermissions = async () => {
        setSaving(true);
        try {
            await updateRolePermissions(role.id, selectedPermIds);
            setShowSuccess(true);
        } catch {
            alert(intl.formatMessage({id: 'roles.errors.save'}));
        } finally {
            setSaving(false);
        }
    };

    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        const groupName = perm.group || intl.formatMessage({id: 'roles.permissions.ungrouped'});

        if (!acc.has(groupName)) {
            acc.set(groupName, []);
        }
        acc.get(groupName)!.push(perm);

        return acc;
    }, new Map<string, Permission[]>());

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 4, width: '100%'}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <Typography variant="h4" fontWeight="bold" color="#2b5073" textAlign="left">
                    {intl.formatMessage({id: 'roles.permissions.title'}, {name: role.role_name})}
                </Typography>

                <Button
                    variant="contained"
                    onClick={() => {
                        void handleSavePermissions();
                    }}
                    disabled={saving}
                    sx={{bgcolor: '#2b5073', px: 4, py: 1.5, borderRadius: '12px'}}
                >
                    {saving ? <CircularProgress size={24}
                                                color="inherit"/> : intl.formatMessage({id: 'roles.permissions.save'})}
                </Button>
            </Box>

            <Box sx={{display: 'flex', flexDirection: 'column', gap: 5, maxWidth: '1200px'}}>
                {Array.from(groupedPermissions.entries()).map(([groupName, perms]) => (
                    <Box key={groupName}>
                        <Typography variant="subtitle1" fontWeight="bold" textAlign="left" sx={{
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            mb: 1,
                            borderBottom: '2px solid rgba(0,0,0,0.05)',
                            pb: 1
                        }}>
                            {groupName}
                        </Typography>

                        <Box sx={{display: 'flex', flexDirection: 'column'}}>
                            {perms.map((perm, index) => (
                                <Box
                                    key={perm.id}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(300px, 400px) 1fr auto',
                                        alignItems: 'center',
                                        gap: 3,
                                        py: 1.5, px: 1,
                                        borderBottom: index !== perms.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                                        transition: 'background-color 0.2s',
                                        '&:hover': {bgcolor: 'rgba(0,0,0,0.02)'}
                                    }}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap'}}>
                                        <Typography variant="body1" fontWeight={600} color="text.primary"
                                                    textAlign="left">
                                            {perm.name || perm.code}
                                        </Typography>

                                        <Typography component="span" variant="caption" sx={{
                                            px: 1,
                                            py: 0.5,
                                            bgcolor: 'rgba(0,0,0,0.05)',
                                            borderRadius: '6px',
                                            color: 'text.secondary',
                                            fontWeight: 500,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {perm.code}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" textAlign="left">
                                        {perm.description || '—'}
                                    </Typography>

                                    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                        <Switch
                                            checked={selectedPermIds.includes(perm.id)}
                                            onChange={() => {
                                                handleToggle(perm.id);
                                            }}
                                            color="primary"
                                        />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ))}
            </Box>

            <Snackbar
                open={showSuccess}
                autoHideDuration={3000}
                onClose={() => {
                    setShowSuccess(false);
                }}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
                <Alert severity="success" sx={{width: '100%', borderRadius: '12px'}}>
                    {intl.formatMessage({id: 'roles.permissions.success'})}
                </Alert>
            </Snackbar>
        </Box>
    );
}