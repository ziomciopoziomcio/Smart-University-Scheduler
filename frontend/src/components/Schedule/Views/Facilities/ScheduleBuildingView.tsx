import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

// @ts-expect-error: some internal issue with svgr types, but it works
import ApartmentIcon from '@assets/icons/building.svg?react';
import type {Building} from '@api';
import {ListPagination, ListView, type ListColumn} from '@components/Common';

interface ScheduleBuildingViewProps {
    data: Building[];
    campusId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function ScheduleBuildingView({
                                              data, campusId, page, pageSize, totalItems, onPageChange, onPageSizeChange
                                          }: ScheduleBuildingViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const formatRoomsCount = (count?: number | null) => {
        if (count === undefined || count === null) return `? ${intl.formatMessage({id: 'facilities.room.rooms'})}`;
        return intl.formatMessage({id: 'facilities.building.roomsCount'}, {count});
    };

    const columns: ListColumn<Building>[] = [
        {
            render: (item: Building) => item.building_name || intl.formatMessage({id: 'facilities.common.noName'}),
            variant: 'secondary',
            width: '250px'
        },
        {
            render: (item: any) => formatRoomsCount(item.rooms_count ?? item.roomsCount),
            variant: 'secondary',
            width: '100px'
        }
    ];

    return (
        <Box>
            <ListView<Building>
                items={data}
                icon={ApartmentIcon}
                getTitle={(item: Building) => `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${item.building_number}`}
                titleWidth="150px"
                columns={columns}
                onItemClick={(item) => navigate(`/plans/rooms/campus/${campusId}/building/${item.id}/room`)}
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