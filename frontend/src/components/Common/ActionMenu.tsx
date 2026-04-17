import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';

interface ActionMenuProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    editLabel?: string;
    deleteLabel?: string;
}

export default function ActionMenu({
    anchorEl,
    onClose,
    onEdit,
    onDelete,
    editLabel,
    deleteLabel
}: ActionMenuProps) {

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    minWidth: '160px',
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.08)'
                }
            }}
        >
            <MenuItem
                onClick={() => { onClose(); onEdit(); }}
                sx={{ py: 1.5 }}
            >
                <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
                <ListItemText>{editLabel}</ListItemText>
            </MenuItem>

            <MenuItem
                onClick={() => { onClose(); onDelete(); }}
                sx={{ py: 1.5, color: 'error.main' }}
            >
                <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>{deleteLabel}</ListItemText>
            </MenuItem>
        </Menu>
    );
}