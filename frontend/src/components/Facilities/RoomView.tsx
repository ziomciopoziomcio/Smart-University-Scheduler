import { useState } from 'react';
import { Box } from '@mui/material';
import { MeetingRoom, Chair, Computer, Videocam } from '@mui/icons-material';
import { useIntl } from 'react-intl';

import { deleteRoom } from '@api/facilities';
import RoomModal from './RoomModal';
import DeleteConfirmDialog from "@components/Common/DeleteConfirmDialog.tsx";
import ListView from "@components/Common/ListView.tsx";
import ActionMenu from "@components/Common/ActionMenu.tsx";

interface RoomViewProps {
    data: Room[];
    buildingId: number;
    onRefresh: () => void;
}

export default function RoomView({ data, buildingId, onRefresh }: RoomViewProps) {
    const intl = useIntl();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Room) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedRoom(item);
    };

    const handleConfirmDelete = async () => {
        if (!selectedRoom) return;
        setIsDeleting(true);
        try {
            await deleteRoom(selectedRoom.id);
            onRefresh();
            setIsDeleteModalOpen(false);
        } catch (e) {
            alert(intl.formatMessage({ id: 'facilities.room.errors.delete' }));
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
                        render: (item: Room) => `${item.room_capacity} ${intl.formatMessage({ id: 'facilities.common.seats' })}`,
                        icon: Chair,
                        variant: 'secondary',
                        width: '120px'
                    },
                    {
                        render: (item: Room) => `${item.pc_amount} ${intl.formatMessage({ id: 'facilities.common.pcs' })}`,
                        icon: Computer,
                        variant: 'secondary',
                        width: '100px'
                    },
                    {
                        render: (item: Room) => item.projector_availability ?
                            intl.formatMessage({id: 'facilities.common.yes' }) :
                            intl.formatMessage({ id: 'facilities.common.no' }),
                        icon: Videocam,
                        variant: 'secondary',
                        width: '80px'
                    }
                ]}

                onMenuOpen={handleMenuOpen}
                onAddClick={() => {
                    setSelectedRoom(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({ id: 'facilities.room.add' })}
                emptyMessage={intl.formatMessage({ id: 'facilities.common.noData' })}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                onEdit={() => setIsModalOpen(true)}
                onDelete={() => setIsDeleteModalOpen(true)}
                editLabel={intl.formatMessage({ id: 'facilities.room.edit' })}
                deleteLabel={intl.formatMessage({ id: 'facilities.room.delete' })}
            />

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
                title={intl.formatMessage({ id: 'facilities.room.deleteTitle' })}
                description={intl.formatMessage({ id: 'facilities.room.deleteDesc' })}
                cancelButtonLabel={intl.formatMessage({ id: 'facilities.common.cancel' })}
                confirmButtonLabel={intl.formatMessage({ id: 'facilities.common.deleteConfirm' })}
                onConfirm={handleConfirmDelete}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        </Box>
    );
}