import {useState} from 'react';
import {Box} from '@mui/material';
import {AccountBalance} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {deleteFaculty, type Faculty} from '@api';
import FacultyModal from './FacultyModal';
import {TileView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {useIntl} from 'react-intl';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface FacultyViewProps {
    data: Faculty[];
    onAddClick?: () => void;
    onRefresh: () => void;
}

export function FacultyView({data, onRefresh}: FacultyViewProps) {
    const intl = useIntl();
    const navigate = useNavigate();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateFaculty = hasAnyPermission([PERMISSIONS.FACULTY_CREATE]);
    const canUpdateFaculty = hasAnyPermission([PERMISSIONS.FACULTY_UPDATE]);
    const canDeleteFaculty = hasAnyPermission([PERMISSIONS.FACULTY_DELETE]);
    const canUseFacultyActions = canUpdateFaculty || canDeleteFaculty;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Faculty) => {
        if (!canUseFacultyActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedFaculty(item);
    };

    const handleAddClick = () => {
        if (!canCreateFaculty) {
            return;
        }

        setSelectedFaculty(null);
        setIsEditModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateFaculty) {
            return;
        }

        handleMenuClose();
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = () => {
        if (!canDeleteFaculty) {
            return;
        }

        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedFaculty || !canDeleteFaculty) {
            return;
        }

        try {
            await deleteFaculty(selectedFaculty.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedFaculty(null);
        } catch {
            alert(intl.formatMessage({id: 'structures.faculty.errors.delete'}));
        }
    };

    return (
        <Box>
            <TileView
                items={data}
                icon={AccountBalance}
                variant="flat"
                iconSize={50}
                getTitle={(item: Faculty) => item.faculty_short}
                getSubtitle={(item: Faculty) => item.faculty_name}
                onItemClick={(item: Faculty) => {
                    navigate(`/structures/faculty/${item.id}`);
                }}
                onMenuOpen={canUseFacultyActions ? handleMenuOpen : undefined}
                onAddClick={canCreateFaculty ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'structures.faculty.add'})}

            />

            {canUseFacultyActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateFaculty ? handleEditClick : undefined}
                    onDelete={canDeleteFaculty ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'structures.faculty.edit'})}
                    deleteLabel={intl.formatMessage({id: 'structures.faculty.delete'})}
                />
            )}

            {(canCreateFaculty || canUpdateFaculty) && (
                <FacultyModal
                    open={isEditModalOpen}
                    faculty={selectedFaculty}
                    onClose={() => {
                        setIsEditModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}

            {canDeleteFaculty && (
                <DeleteConfirmDialog
                    open={isDeleteModalOpen}
                    title={intl.formatMessage({id: 'structures.faculty.deleteTitle'})}
                    description={intl.formatMessage({id: 'structures.faculty.deleteDesc'})}
                    onConfirm={() => {
                        void handleConfirmDelete();
                    }}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                    }}
                    cancelButtonLabel={intl.formatMessage({id: 'structures.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'structures.faculty.delete'})}
                />
            )}
        </Box>
    );
}