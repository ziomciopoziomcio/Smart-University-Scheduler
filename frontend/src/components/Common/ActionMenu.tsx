import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';

interface ActionMenuProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    editLabel?: string;
    deleteLabel?: string;
    hideEdit?: boolean;
    hideDelete?: boolean;
}

export default function ActionMenu({
    anchorEl,
    onClose,
    onEdit,
    onDelete,
    editLabel,
    deleteLabel,
    hideEdit,
    hideDelete
}: ActionMenuProps) {

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '12px',
                        minWidth: '160px',
                        boxShadow: '0px 4px 20px rgba(0,0,0,0.08)'
                    }
                }
            }}
        >
            {!hideEdit && onEdit && (
                <MenuItem
                    onClick={() => { onClose(); onEdit(); }}
                    sx={{ py: 1.5 }}
                >
                    <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
                    <ListItemText>{editLabel}</ListItemText>
                </MenuItem>
            )}

            {!hideDelete && onDelete && (
                <MenuItem
                    onClick={() => { onClose(); onDelete(); }}
                    sx={{ py: 1.5, color: 'error.main' }}
                >
                    <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>{deleteLabel}</ListItemText>
                </MenuItem>
            )}
        </Menu>
    );
}