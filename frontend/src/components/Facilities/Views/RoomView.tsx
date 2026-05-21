import {useState} from 'react';
import {Box} from '@mui/material';
import {MeetingRoom, Chair, Computer, Videocam} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {deleteRoom, type Room} from '@api';
import {RoomModal} from '@components/Facilities/Modals/RoomModal';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface RoomViewProps {
    data: Room[];
    buildingId: number;
    onRefresh: () => void;
}

export function RoomView({data, buildingId, onRefresh}: RoomViewProps) {
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateRoom = hasAnyPermission([PERMISSIONS.ROOM_CREATE]);
    const canUpdateRoom = hasAnyPermission([PERMISSIONS.ROOM_UPDATE]);
    const canDeleteRoom = hasAnyPermission([PERMISSIONS.ROOM_DELETE]);
    const canUseRoomActions = canUpdateRoom || canDeleteRoom;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Room) => {
        if (!canUseRoomActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedRoom(item);
    };

    const handleAddClick = () => {
        if (!canCreateRoom) {
            return;
        }

        setSelectedRoom(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateRoom) {
            return;
        }

        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleDeleteClick = () => {
        if (!canDeleteRoom) {
            return;
        }

        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedRoom || !canDeleteRoom) {
            return;
        }

        setIsDeleting(true);

        try {
            await deleteRoom(selectedRoom.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedRoom(null);
        } catch {
            alert(intl.formatMessage({id: 'facilities.room.errors.delete'}));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box>
            <ListView
                items={data}
                icon={MeetingRoom}
                getTitle={(item: Room) => item.room_name}
                titleWidth="180px"
                columns={[
                    {
                        render: (item: Room) =>
                            `${item.room_capacity} ${intl.formatMessage({id: 'facilities.common.seats'})}`,
                        icon: Chair,
                        variant: 'secondary',
                        width: '120px',
                    },
                    {
                        render: (item: Room) =>
                            `${item.pc_amount} ${intl.formatMessage({id: 'facilities.common.pcs'})}`,
                        icon: Computer,
                        variant: 'secondary',
                        width: '100px',
                    },
                    {
                        render: (item: Room) =>
                            item.projector_availability
                                ? intl.formatMessage({id: 'facilities.common.yes'})
                                : intl.formatMessage({id: 'facilities.common.no'}),
                        icon: Videocam,
                        variant: 'secondary',
                        width: '80px',
                    },
                ]}
                onMenuOpen={canUseRoomActions ? handleMenuOpen : undefined}
                onAddClick={canCreateRoom ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'facilities.room.add'})}
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
            />

            {canUseRoomActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateRoom ? handleEditClick : undefined}
                    onDelete={canDeleteRoom ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'facilities.room.edit'})}
                    deleteLabel={intl.formatMessage({id: 'facilities.room.delete'})}
                />
            )}

            {(canCreateRoom || canUpdateRoom) && (
                <RoomModal
                    open={isModalOpen}
                    buildingId={buildingId}
                    room={selectedRoom}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}

            {canDeleteRoom && (
                <DeleteConfirmDialog
                    open={isDeleteModalOpen}
                    loading={isDeleting}
                    title={intl.formatMessage({id: 'facilities.room.deleteTitle'})}
                    description={intl.formatMessage({id: 'facilities.room.deleteDesc'})}
                    cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'facilities.common.deleteConfirm'})}
                    onConfirm={handleConfirmDelete}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                    }}
                />
            )}
        </Box>
    );
}