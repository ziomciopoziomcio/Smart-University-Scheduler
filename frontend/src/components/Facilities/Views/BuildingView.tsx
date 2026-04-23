import {useState} from 'react';
import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

// @ts-expect-error: vite svg import workaround
import buildingIcon from '@assets/icons/building.svg?react';
import {type Building, deleteBuilding} from '@api';
import {BuildingModal} from '../Modals/BuildingModal.tsx';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';

interface BuildingViewProps {
    data: Building[];
    campusId: number;
    onRefresh: () => void;
}

export function BuildingView({data, campusId, onRefresh}: BuildingViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Building) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedBuilding(item);
    };

    const handleMenuClose = () => setAnchorEl(null);

    const confirmDelete = async () => {
        if (!selectedBuilding) return;
        setIsDeleting(true);
        try {
            await deleteBuilding(selectedBuilding.id);
            setIsDeleteModalOpen(false);
            onRefresh();
        } catch {
            alert(intl.formatMessage({id: 'facilities.building.errors.delete'}));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box>
            <ListView
                items={data}
                icon={buildingIcon}
                getTitle={(item: Building) => `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${item.building_number}`}
                titleWidth="150px"
                columns={[
                    {
                        render: (item: Building) => item.building_name || intl.formatMessage({id: 'facilities.common.noName'}),
                        variant: 'secondary',
                        width: '250px'
                    },
                    {
                        // TODO: get room count from API (waiting for endpoint)
                        render: () => `? ${intl.formatMessage({id: 'facilities.room.rooms'})}`,
                        variant: 'secondary',
                        width: '100px'
                    }
                ]}

                onItemClick={(item: Building) => {
                    navigate(`/facilities/campus/${campusId}/building/${item.id}`);
                }}
                onMenuOpen={handleMenuOpen}
                onAddClick={() => {
                    setSelectedBuilding(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'facilities.building.add'})}
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={handleMenuClose}
                onEdit={() => {
                    handleMenuClose();
                    setIsModalOpen(true);
                }}
                onDelete={() => {
                    handleMenuClose();
                    setIsDeleteModalOpen(true);
                }}
                editLabel={intl.formatMessage({id: 'facilities.building.edit'})}
                deleteLabel={intl.formatMessage({id: 'facilities.building.delete'})}
            />

            <BuildingModal
                open={isModalOpen}
                campusId={campusId}
                building={selectedBuilding}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onRefresh}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                loading={isDeleting}
                title={intl.formatMessage({id: 'facilities.building.deleteTitle'})}
                description={intl.formatMessage({id: 'facilities.building.deleteDesc'})}
                cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'facilities.building.delete'})}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}