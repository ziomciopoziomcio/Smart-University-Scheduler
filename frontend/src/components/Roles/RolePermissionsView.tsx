import {useState, useEffect, useMemo} from 'react';
import {Box, Typography, Switch, Paper, Button, Zoom, CircularProgress, Snackbar, Alert, Tooltip, Collapse, IconButton} from '@mui/material';
import {Save, HourglassEmpty, ExpandMore} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {type Role, type Permission, updateRolePermissions} from '@api';

interface RolePermissionsViewProps {
    role: Role;
    allPermissions: Permission[];
}

export function RolePermissionsView({role, allPermissions}: RolePermissionsViewProps) {
    const intl = useIntl();

    const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
    const [initialPermIds, setInitialPermIds] = useState<number[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (role) {
            const ids = role.permissions.map(p => p.id);
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
        setSelectedPermIds(prev =>
            prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
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
                    {/* GROUP NAME PAPER BAR */}
                    <Paper
                        elevation={0}
                        onClick={() => toggleGroup(groupName)}
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
                            bgcolor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {bgcolor: '#f8fafc'},
                            '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '2px'
                            }
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                                color: '#000000',
                                textTransform: 'uppercase',
                                letterSpacing: 1.2,
                                userSelect: 'none'
                            }}
                        >
                            {groupName}
                        </Typography>
                        <IconButton
                            size="small"
                            component="div" // Prevent button inside button
                            sx={{
                                transform: collapsedGroups.has(groupName) ? 'rotate(-90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s'
                            }}
                        >
                            <ExpandMore />
                        </IconButton>
                    </Paper>

                    {/* PERMISSIONS LIST COLLAPSE */}
                    <Collapse in={!collapsedGroups.has(groupName)} id={`permissions-group-${groupName}`}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                bgcolor: '#ffffff'
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
                                            borderBottom: index !== perms.length - 1 ? '1px solid #f1f5f9' : 'none',
                                            transition: 'background-color 0.15s',
                                            '&:hover': {bgcolor: '#f8fafc'}
                                        }}
                                    >
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap'}}>
                                            <Typography variant="body2" fontWeight={400} color="#1e293b">
                                                {perm.name || perm.code}
                                            </Typography>

                                            <Typography
                                                component="span"
                                                variant="caption"
                                                sx={{
                                                    px: 1,
                                                    py: 0.4,
                                                    bgcolor: '#f1f5f9',
                                                    borderRadius: '6px',
                                                    color: '#64748b',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.65rem'
                                                }}
                                            >
                                                {perm.code}
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" color="#64748b">
                                            {perm.description || '—'}
                                        </Typography>

                                        <Box sx={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2}}>
                                            {isDirty(perm.id) && (
                                                <Tooltip title={intl.formatMessage({id: 'roles.permissions.unsaved', defaultMessage: 'Unsaved changes'})}>
                                                    <HourglassEmpty sx={{fontSize: 18, color: '#f59e0b', animation: 'spin 2s linear infinite'}} />
                                                </Tooltip>
                                            )}
                                            <Switch
                                                checked={selectedPermIds.includes(perm.id)}
                                                onChange={() => handleToggle(perm.id)}
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
                                                                backgroundColor: '#2b5073',
                                                                opacity: 1,
                                                                border: 0,
                                                            },
                                                        },
                                                    },
                                                    '& .MuiSwitch-thumb': {
                                                        boxSizing: 'border-box',
                                                        width: 22,
                                                        height: 22,
                                                        backgroundColor: '#fff',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    },
                                                    '& .MuiSwitch-track': {
                                                        borderRadius: 26 / 2,
                                                        backgroundColor: '#cbd5e1',
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

            {/* CONDITIONAL SAVE BUTTON (FLOATING) */}
            <Zoom in={hasChanges}>
                <Box sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                            bgcolor: '#2b5073',
                            px: 4,
                            py: 1.5,
                            borderRadius: '50px',
                            fontWeight: 700,
                            boxShadow: '0 10px 25px rgba(43, 80, 115, 0.3)',
                            '&:hover': {
                                bgcolor: '#1e3a54',
                                boxShadow: '0 12px 30px rgba(43, 80, 115, 0.4)',
                            }
                        }}
                    >
                        {saving ? intl.formatMessage({id: 'common.saving'}) : intl.formatMessage({id: 'common.save'})}
                    </Button>
                </Box>
            </Zoom>

            <Snackbar
                open={showSuccess}
                autoHideDuration={3000}
                onClose={() => setShowSuccess(false)}
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