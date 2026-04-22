import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import {MeetingRoom, Chair, Computer, Videocam} from '@mui/icons-material';
import ListView, {type ListColumn} from '@components/Common/ListView.tsx';
import ListPagination from '@components/Common/ListPagination.tsx';
import type {Room} from '@api/types';

interface PlansRoomViewProps {
    data: Room[];
    campusId: number;
    buildingId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export default function PlansRoomView({
                                          data,
                                          campusId,
                                          buildingId,
                                          page,
                                          pageSize,
                                          totalItems,
                                          onPageChange,
                                          onPageSizeChange
                                      }: PlansRoomViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const columns: ListColumn<Room>[] = [
        {
            render: (item: Room) => `${item.room_capacity} ${intl.formatMessage({id: 'facilities.common.seats'})}`,
            icon: Chair,
            variant: 'secondary',
            width: '120px'
        },
        {
            render: (item: Room) => `${item.pc_amount} ${intl.formatMessage({id: 'facilities.common.pcs'})}`,
            icon: Computer,
            variant: 'secondary',
            width: '100px'
        },
        {
            render: (item: Room) => item.projector_availability ?
                intl.formatMessage({id: 'facilities.common.yes'}) :
                intl.formatMessage({id: 'facilities.common.no'}),
            icon: Videocam,
            variant: 'secondary',
            width: '80px'
        }
    ];

    return (
        <Box>
            <ListView<Room>
                items={data}
                icon={MeetingRoom}
                getTitle={(item: Room) => item.room_name}
                titleWidth="180px"
                columns={columns}
                onItemClick={(item) =>
                    navigate(`/plans/rooms/campus/${campusId}/building/${buildingId}/room/${item.id}`)
                }
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
                hideDividerOnLastItem
            />
            {totalItems > 0 && (
                <ListPagination
                    page={page}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    pageSizeOptions={[5, 10, 20, 50]}
                />
            )}
        </Box>
    );
}