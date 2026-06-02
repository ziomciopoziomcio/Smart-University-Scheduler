import {useState} from 'react';
import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

// @ts-expect-error: vite svg import workaround
import buildingIcon from '@assets/icons/building.svg?react';
import {type Building, deleteBuilding} from '@api';
import {BuildingModal} from '../Modals/BuildingModal.tsx';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface BuildingViewProps {
    data: Building[];
    campusId: number;
    onRefresh: () => void;
}

export function BuildingView({data, campusId, onRefresh}: BuildingViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateBuilding = hasAnyPermission([PERMISSIONS.BUILDING_CREATE]);
    const canUpdateBuilding = hasAnyPermission([PERMISSIONS.BUILDING_UPDATE]);
    const canDeleteBuilding = hasAnyPermission([PERMISSIONS.BUILDING_DELETE]);
    const canUseBuildingActions = canUpdateBuilding || canDeleteBuilding;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Building) => {
        if (!canUseBuildingActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedBuilding(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAddClick = () => {
        if (!canCreateBuilding) {
            return;
        }

        setSelectedBuilding(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateBuilding) {
            return;
        }

        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleDeleteClick = () => {
        if (!canDeleteBuilding) {
            return;
        }

        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedBuilding || !canDeleteBuilding) {
            return;
        }

        setIsDeleting(true);

        try {
            await deleteBuilding(selectedBuilding.id);
            setIsDeleteModalOpen(false);
            setSelectedBuilding(null);
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
                getTitle={(item: Building) =>
                    `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${item.building_number}`
                }
                titleWidth="150px"
                columns={[
                    {
                        render: (item: Building) =>
                            item.building_name || intl.formatMessage({id: 'facilities.common.noName'}),
                        variant: 'secondary',
                        width: '250px',
                    },
                    {
                        render: (item: Building) => intl.formatMessage(
                            {id: 'facilities.building.roomsCount'},
                            {count: item.rooms_number},
                        ),
                        variant: 'secondary',
                        width: '120px',
                    },
                ]}
                onItemClick={(item: Building) => {
                    navigate(`/facilities/campus/${campusId}/building/${item.id}`);
                }}
                onMenuOpen={canUseBuildingActions ? handleMenuOpen : undefined}
                onAddClick={canCreateBuilding ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'facilities.building.add'})}
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
            />

            {canUseBuildingActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateBuilding ? handleEditClick : undefined}
                    onDelete={canDeleteBuilding ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'facilities.building.edit'})}
                    deleteLabel={intl.formatMessage({id: 'facilities.building.delete'})}
                />
            )}

            {(canCreateBuilding || canUpdateBuilding) && (
                <BuildingModal
                    open={isModalOpen}
                    campusId={campusId}
                    building={selectedBuilding}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}

            {canDeleteBuilding && (
                <DeleteConfirmDialog
                    open={isDeleteModalOpen}
                    loading={isDeleting}
                    title={intl.formatMessage({id: 'facilities.building.deleteTitle'})}
                    description={intl.formatMessage({id: 'facilities.building.deleteDesc'})}
                    cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'facilities.building.delete'})}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                    }}
                    onConfirm={confirmDelete}
                />
            )}
        </Box>
    );
}