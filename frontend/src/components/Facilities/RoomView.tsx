import { useState } from 'react';
import { Box, Typography, Divider, Button, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Add, MoreVert, EditOutlined, DeleteOutline, MeetingRoomOutlined } from '@mui/icons-material';
import { useIntl } from 'react-intl';

import { type Room } from '@api/types';
import { deleteRoom } from '@api/facilities';
import RoomModal from './RoomModal';
import DeleteConfirmDialog from '@components/Common/DeleteConfirmDialog';

interface RoomViewProps {
    data: Room[];
    buildingId: number;
    onRefresh: () => void;
}

export default function RoomView({ data, buildingId, onRefresh }: RoomViewProps) {
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, room: Room) => {
        setAnchorEl(event.currentTarget);
        setSelectedRoom(room);
    };

    const handleMenuClose = () => setAnchorEl(null);

    const handleOpenAdd = () => {
        setSelectedRoom(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = () => {
        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleOpenDelete = () => {
        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedRoom) return;
        setIsDeleting(true);
        try {
            await deleteRoom(selectedRoom.id);
            setIsDeleteModalOpen(false);
            onRefresh();
        } catch (error) {
            alert('Wystąpił błąd podczas usuwania sali.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box>
            {data.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    {intl.formatMessage({ id: 'facilities.noData' })}
                </Typography>
            )}

            {data.map((item) => (
                <Box key={item.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 2, '&:hover': { bgcolor: '#fbfbfb' } }}>
                        {/* Ikonka */}
                        <Box sx={{ mr: 3, display: 'flex', alignItems: 'center' }}>
                            <MeetingRoomOutlined sx={{ fontSize: 28, color: 'rgba(0,0,0,0.4)' }} />
                        </Box>

                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Nazwa sali */}
                            <Typography fontWeight={600} sx={{ width: '150px' }}>
                                {item.room_name}
                            </Typography>

                            {/* Szczegóły sali */}
                            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                                {item.room_capacity} {intl.formatMessage({ id: 'facilities.seats' })} • {item.pc_amount} {intl.formatMessage({ id: 'facilities.pcs' })}
                            </Typography>
                        </Box>

                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, item)}>
                            <MoreVert sx={{ color: '#aaa' }} />
                        </IconButton>
                    </Box>
                    <Divider />
                </Box>
            ))}

            <Button startIcon={<Add />} onClick={handleOpenAdd} sx={{ mt: 2, color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}>
                {intl.formatMessage({ id: 'facilities.addRoom' })}
            </Button>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { borderRadius: '12px', minWidth: '180px', boxShadow: '0px 4px 20px rgba(0,0,0,0.08)' } }}>
                <MenuItem onClick={handleOpenEdit} sx={{ py: 1.5 }}>
                    <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
                    <ListItemText>{intl.formatMessage({ id: 'facilities.menu.edit' })}</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenDelete} sx={{ py: 1.5, color: 'error.main' }}>
                    <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>{intl.formatMessage({ id: 'facilities.menu.delete' })}</ListItemText>
                </MenuItem>
            </Menu>

            <RoomModal
                open={isModalOpen}
                buildingId={buildingId}
                room={selectedRoom}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onRefresh}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                loading={isDeleting}
                title={intl.formatMessage({ id: 'facilities.deleteConfirm.titleRoom' })}
                description={intl.formatMessage({ id: 'facilities.deleteConfirm.descriptionRoom' })}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}