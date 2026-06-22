import {useState} from 'react';
import {Paper, Box, Typography, Chip} from '@mui/material';
import {Key, AccessTime} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useTheme, alpha} from '@mui/material/styles';
import {ListView, DeleteConfirmDialog, ActionMenu} from '@components/Common';
import {type APIKeyInfo} from '@api/domains/users/apikeys';

interface APIKeyListProps {
    keys: APIKeyInfo[];
    onRevoke: (keyId: number) => Promise<void>;
}

export const APIKeyList = ({keys, onRevoke}: APIKeyListProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState<APIKeyInfo | null>(null);

    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedKeyForMenu, setSelectedKeyForMenu] = useState<APIKeyInfo | null>(null);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, key: APIKeyInfo) => {
        if (!key.is_active) return;
        setMenuAnchorEl(e.currentTarget);
        setSelectedKeyForMenu(key);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleRevokeClick = (key: APIKeyInfo) => {
        setSelectedKey(key);
        setConfirmOpen(true);
        handleMenuClose();
    };

    const handleConfirmRevoke = async () => {
        if (!selectedKey) return;
        setConfirmOpen(false);
        try {
            await onRevoke(selectedKey.id);
        } finally {
            setSelectedKey(null);
        }
    };

    return (
        <Paper>
            <ListView<APIKeyInfo>
                items={keys}
                icon={Key}
                getTitle={(item) => item.name}
                titleWidth="250px"
                emptyMessage={intl.formatMessage({id: 'publicapi.noKeys'})}
                onMenuOpen={handleMenuOpen}
                showActionButton={(item) => item.is_active}
                columns={[
                    {
                        render: (item) => (
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <AccessTime sx={{fontSize: 16, color: 'text.secondary', opacity: 0.8}}/>
                                <Typography variant="body2" color="text.secondary">
                                    {item.expiration_date}
                                </Typography>
                            </Box>
                        ),
                        width: '250px',
                    },
                    {
                        render: (item) => (
                            <Chip
                                label={intl.formatMessage({
                                    id: item.is_active ? 'publicapi.active' : 'publicapi.revoked'
                                })}
                                color={item.is_active ? 'success' : 'default'}
                                size="small"
                                sx={{
                                    fontWeight: 600,
                                    bgcolor: item.is_active 
                                        ? alpha(theme.palette.success.main, 0.08) 
                                        : alpha(theme.palette.action.disabled, 0.08),
                                    color: item.is_active 
                                        ? theme.palette.success.main 
                                        : theme.palette.text.secondary,
                                    border: 'none'
                                }}
                            />
                        ),
                        width: '150px',
                    }
                ]}
            />

            <ActionMenu
                anchorEl={menuAnchorEl}
                onClose={handleMenuClose}
                onDelete={() => {
                    if (selectedKeyForMenu) {
                        handleRevokeClick(selectedKeyForMenu);
                    }
                }}
                deleteLabel={intl.formatMessage({id: 'academics.students.delete'})}
                hideEdit
            />

            <DeleteConfirmDialog
                open={confirmOpen}
                title={intl.formatMessage({id: 'publicapi.revokeConfirmTitle'})}
                description={intl.formatMessage(
                    {id: 'publicapi.revokeConfirmDesc'},
                    {name: selectedKey?.name}
                )}
                cancelButtonLabel={intl.formatMessage({id: 'academics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'publicapi.revokeConfirmTitle'})}
                onConfirm={() => { void handleConfirmRevoke(); }}
                onClose={() => setConfirmOpen(false)}
            />
        </Paper>
    );
};
