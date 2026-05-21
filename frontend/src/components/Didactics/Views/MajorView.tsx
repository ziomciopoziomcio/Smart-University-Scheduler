import {useState} from 'react';
import {Box} from '@mui/material';
import {Class} from '@mui/icons-material';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type Major, deleteMajor} from '@api';
import {MajorModal} from '../Modals/MajorModal.tsx';
import {useIntl} from 'react-intl';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

export function MajorView({
                              fieldId,
                              data,
                              onRefresh,
                          }: {
    fieldId: number;
    data: Major[];
    onRefresh: () => void;
}) {
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateMajor = hasAnyPermission([PERMISSIONS.MAJOR_CREATE]);
    const canUpdateMajor = hasAnyPermission([PERMISSIONS.MAJOR_UPDATE]);
    const canDeleteMajor = hasAnyPermission([PERMISSIONS.MAJOR_DELETE]);
    const canUseMajorActions = canUpdateMajor || canDeleteMajor;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<Major | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Major) => {
        if (!canUseMajorActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelected(item);
    };

    const handleAddClick = () => {
        if (!canCreateMajor) {
            return;
        }

        setSelected(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateMajor) {
            return;
        }

        setIsModalOpen(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        if (!canDeleteMajor) {
            return;
        }

        setIsDeleteOpen(true);
        handleMenuClose();
    };

    const handleConfirmDelete = async () => {
        if (!selected || !canDeleteMajor) {
            return;
        }

        await deleteMajor(selected.id);
        onRefresh();
        setIsDeleteOpen(false);
        setSelected(null);
    };

    return (
        <Box>
            <ListView<Major>
                items={data || []}
                icon={Class}
                getTitle={(item) => item.major_name}
                onMenuOpen={canUseMajorActions ? handleMenuOpen : undefined}
                onAddClick={canCreateMajor ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'didactics.majors.add'})}
            />

            {canUseMajorActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateMajor ? handleEditClick : undefined}
                    onDelete={canDeleteMajor ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                    deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                />
            )}

            {canDeleteMajor && (
                <DeleteConfirmDialog
                    open={isDeleteOpen}
                    title={intl.formatMessage({id: 'didactics.majors.deleteTitle'})}
                    description={intl.formatMessage(
                        {id: 'didactics.majors.deleteDesc'},
                        {name: selected?.major_name},
                    )}
                    cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                    onConfirm={() => {
                        void handleConfirmDelete();
                    }}
                    onClose={() => {
                        setIsDeleteOpen(false);
                    }}
                />
            )}

            {(canCreateMajor || canUpdateMajor) && (
                <MajorModal
                    open={isModalOpen}
                    major={selected}
                    fieldId={fieldId}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}
        </Box>
    );
}