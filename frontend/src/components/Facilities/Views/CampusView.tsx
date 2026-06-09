import {useState} from 'react';
import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

// @ts-expect-error: vite svg import workaround
import buildingIcon from '@assets/icons/buildings.svg?react';
import {deleteCampus, type Campus} from '@api';
import {CampusModal} from '../Modals/CampusModal.tsx';
import {TileView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface CampusViewProps {
    data: Campus[];
    onRefresh: () => void;
}

export function CampusView({data, onRefresh}: CampusViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateCampus = hasAnyPermission([PERMISSIONS.CAMPUS_CREATE]);
    const canUpdateCampus = hasAnyPermission([PERMISSIONS.CAMPUS_UPDATE]);
    const canDeleteCampus = hasAnyPermission([PERMISSIONS.CAMPUS_DELETE]);
    const canUseCampusActions = canUpdateCampus || canDeleteCampus;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Campus) => {
        if (!canUseCampusActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedCampus(item);
    };

    const handleAddClick = () => {
        if (!canCreateCampus) {
            return;
        }

        setSelectedCampus(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateCampus) {
            return;
        }

        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleDeleteClick = () => {
        if (!canDeleteCampus) {
            return;
        }

        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCampus || !canDeleteCampus) {
            return;
        }

        try {
            await deleteCampus(selectedCampus.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedCampus(null);
        } catch {
            // TODO: Maybe change to snackbar
            alert(intl.formatMessage({id: 'facilities.campus.errors.delete'}));
        }
    };

    return (
        <Box>
            <TileView
                items={data}
                icon={buildingIcon}
                variant="flat"
                iconSize={50}
                getTitle={(item: Campus) =>
                    item.campus_name
                    || `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${item.campus_short}`
                }
                getSubtitle={(item: Campus) => item.campus_short}
                onItemClick={(item: Campus) => {
                    navigate(`/facilities/campus/${item.id}`);
                }}
                onMenuOpen={canUseCampusActions ? handleMenuOpen : undefined}
                onAddClick={canCreateCampus ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'facilities.campus.add'})}
            />

            {canUseCampusActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateCampus ? handleEditClick : undefined}
                    onDelete={canDeleteCampus ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'facilities.campus.edit'})}
                    deleteLabel={intl.formatMessage({id: 'facilities.campus.delete'})}
                />
            )}

            {(canCreateCampus || canUpdateCampus) && (
                <CampusModal
                    open={isModalOpen}
                    campus={selectedCampus}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}

            {canDeleteCampus && (
                <DeleteConfirmDialog
                    open={isDeleteModalOpen}
                    title={intl.formatMessage({id: 'facilities.campus.deleteTitle'})}
                    description={intl.formatMessage({id: 'facilities.campus.deleteDesc'})}
                    cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'facilities.campus.delete'})}
                    onConfirm={handleConfirmDelete}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                    }}
                />
            )}
        </Box>
    );
}