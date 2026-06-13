import {useState, useEffect, useMemo} from 'react';
import {
    Box,
    Typography,
    Switch,
    Paper,
    Zoom,
    Snackbar,
    Alert,
    Tooltip,
    Collapse,
    IconButton,
} from '@mui/material';
import {Save, HourglassEmpty, ExpandMore} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {type Role, type Permission, updateRolePermissions} from '@api';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';
import {AppButton} from '@components/Common';

interface RolePermissionsViewProps {
    role: Role;
    allPermissions: Permission[];
}

export function RolePermissionsView({role, allPermissions}: RolePermissionsViewProps) {
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canAddPermissionToRole = hasAnyPermission([
        PERMISSIONS.ROLE_UPDATE,
    ]);

    const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
    const [initialPermIds, setInitialPermIds] = useState<number[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (role) {
            const ids = role.permissions.map((p) => p.id);
            setSelectedPermIds(ids);
            setInitialPermIds(ids);
        }
    }, [role]);

    const hasChanges = useMemo(() => {
        if (selectedPermIds.length !== initialPermIds.length) return true;

        const sortedInitial = [...initialPermIds].sort((a, b) => a - b);
        const sortedSelected = [...selectedPermIds].sort((a, b) => a - b);

        return !sortedInitial.every((val, index) => val === sortedSelected[index]);
    }, [selectedPermIds, initialPermIds]);

    const handleToggle = (permId: number) => {
        if (!canAddPermissionToRole) {
            return;
        }

        setSelectedPermIds((prev) =>
            prev.includes(permId)
                ? prev.filter((id) => id !== permId)
                : [...prev, permId],
        );
    };

    const toggleGroup = (groupName: string) => {
        const next = new Set(collapsedGroups);

        if (next.has(groupName)) next.delete(groupName);
        else next.add(groupName);

        setCollapsedGroups(next);
    };

    const isDirty = (permId: number) => {
        const currentlySelected = selectedPermIds.includes(permId);
        const initiallySelected = initialPermIds.includes(permId);

        return currentlySelected !== initiallySelected;
    };

    const handleSave = async () => {
        if (!canAddPermissionToRole) {
            return;
        }

        setSaving(true);

        try {
            await updateRolePermissions(role.id, selectedPermIds);
            setInitialPermIds([...selectedPermIds]);
            setShowSuccess(true);
        } catch (error) {
            console.error('Error saving permissions:', error);
            window.alert(intl.formatMessage({id: 'roles.errors.save'}));
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
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 4, width: '100%', pb: 10}}>
            {Array.from(groupedPermissions.entries()).map(([groupName, perms]) => (
                <Box key={groupName} sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                    <Paper
                        elevation={0}
                        onClick={() => { toggleGroup(groupName); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleGroup(groupName);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={!collapsedGroups.has(groupName)}
                        aria-controls={`permissions-group-${groupName}`}
                        sx={{
                            px: 3,
                            py: 1.5,
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {bgcolor: 'background.highlight'},
                            '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '2px',
                            },
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                                color: 'text.primary',
                                textTransform: 'uppercase',
                                letterSpacing: 1.2,
                                userSelect: 'none',
                            }}
                        >
                            {groupName}
                        </Typography>

                        <IconButton
                            size="small"
                            component="div"
                            sx={{
                                transform: collapsedGroups.has(groupName) ? 'rotate(-90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                            }}
                        >
                            <ExpandMore/>
                        </IconButton>
                    </Paper>

                    <Collapse in={!collapsedGroups.has(groupName)} id={`permissions-group-${groupName}`}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: '16px',
                                border: 1,
                                borderColor: 'divider',
                                overflow: 'hidden',
                                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.05)',
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                {perms.map((perm, index) => (
                                    <Box
                                        key={perm.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(350px, 450px) 1fr auto',
                                            alignItems: 'center',
                                            gap: 4,
                                            py: 2,
                                            px: 3,
                                            borderBottom: index !== perms.length - 1 ? 1 : 0,
                                            borderColor: 'divider',
                                            transition: 'background-color 0.15s',
                                            '&:hover': {bgcolor: 'background.highlight'},
                                        }}
                                    >
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap'}}>
                                            <Typography variant="body2" fontWeight={400} color="text.primary">
                                                {perm.name || perm.code}
                                            </Typography>

                                            <Typography
                                                component="span"
                                                variant="caption"
                                                sx={{
                                                    px: 1,
                                                    py: 0.4,
                                                    bgcolor: 'background.default',
                                                    borderRadius: '6px',
                                                    color: 'text.secondary',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    fontSize: '0.65rem',
                                                }}
                                            >
                                                {perm.code}
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" color="text.secondary">
                                            {perm.description || '—'}
                                        </Typography>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            {isDirty(perm.id) && canAddPermissionToRole && (
                                                <Tooltip title={intl.formatMessage({
                                                    id: 'roles.permissions.unsaved',
                                                    defaultMessage: 'Unsaved changes'
                                                })}>
                                                    <HourglassEmpty sx={{
                                                        fontSize: 18,
                                                        color: 'warning.main',
                                                        animation: 'spin 2s linear infinite'
                                                    }}/>
                                                </Tooltip>
                                            )}

                                            <Switch
                                                checked={selectedPermIds.includes(perm.id)}
                                                onChange={() => { handleToggle(perm.id); }}
                                                disabled={!canAddPermissionToRole || saving}
                                                sx={{
                                                    width: 50,
                                                    height: 26,
                                                    padding: 0,

                                                    '& .MuiSwitch-switchBase': {
                                                        padding: 0,
                                                        margin: '2px',
                                                        transitionDuration: '300ms',

                                                        '&.Mui-checked': {
                                                            transform: 'translateX(24px)',
                                                            color: '#fff',

                                                            '& + .MuiSwitch-track': {
                                                                backgroundColor: 'primary.main',
                                                                opacity: 1,
                                                                border: 0,
                                                            },
                                                        },

                                                        '&.Mui-disabled': {
                                                            color: 'action.disabled',

                                                            '& + .MuiSwitch-track': {
                                                                backgroundColor: 'action.disabledBackground',
                                                                opacity: 1,
                                                            },
                                                        },

                                                        '&.Mui-disabled.Mui-checked': {
                                                            color: 'action.disabledBackground',

                                                            '& + .MuiSwitch-track': {
                                                                backgroundColor: 'action.disabled',
                                                                opacity: 0.6,
                                                            },
                                                        },
                                                    },

                                                    '& .MuiSwitch-thumb': {
                                                        boxSizing: 'border-box',
                                                        width: 22,
                                                        height: 22,
                                                        backgroundColor: '#fff',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    },

                                                    '& .MuiSwitch-switchBase.Mui-disabled .MuiSwitch-thumb': {
                                                        backgroundColor: 'action.disabled',
                                                        boxShadow: 'none',
                                                    },

                                                    '& .MuiSwitch-track': {
                                                        borderRadius: 26 / 2,
                                                        backgroundColor: 'action.disabledBackground',
                                                        opacity: 1,
                                                        transition: 'background-color 500ms',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Collapse>
                </Box>
            ))}

            {canAddPermissionToRole && (
                <Zoom in={hasChanges}>
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 32,
                            right: 32,
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <AppButton
                            variant="contained"
                            startIcon={!saving && <Save/>}
                            loading={saving}
                            onClick={() => { void handleSave(); }}
                            sx={{
                                px: 4,
                                // borderRadius: '50px',
                                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 10px 25px rgba(0,0,0, 0.4)' : '0 10px 25px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            {saving ? intl.formatMessage({id: 'common.saving'}) : intl.formatMessage({id: 'common.save'})}
                        </AppButton>
                    </Box>
                </Zoom>
            )}

            <Snackbar
                open={showSuccess}
                autoHideDuration={3000}
                onClose={() => { setShowSuccess(false); }}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert severity="success" variant="filled" sx={{borderRadius: '12px'}}>
                    {intl.formatMessage({id: 'roles.permissions.success'})}
                </Alert>
            </Snackbar>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </Box>
    );
}