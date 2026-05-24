import {useState} from 'react';
import {Box} from '@mui/material';
import {Extension} from '@mui/icons-material';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type ElectiveBlock, deleteElectiveBlock} from '@api';
import {BlockModal} from '../Modals/BlockModal.tsx';
import {useIntl} from 'react-intl';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

export function BlockView({
                              fieldId,
                              data,
                              onRefresh,
                          }: {
    fieldId: number;
    data: ElectiveBlock[];
    onRefresh: () => void;
}) {
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateBlock = hasAnyPermission([PERMISSIONS.ELECTIVE_BLOCK_CREATE]);
    const canUpdateBlock = hasAnyPermission([PERMISSIONS.ELECTIVE_BLOCK_UPDATE]);
    const canDeleteBlock = hasAnyPermission([PERMISSIONS.ELECTIVE_BLOCK_DELETE]);
    const canUseBlockActions = canUpdateBlock || canDeleteBlock;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<ElectiveBlock | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: ElectiveBlock) => {
        if (!canUseBlockActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelected(item);
    };

    const handleAddClick = () => {
        if (!canCreateBlock) {
            return;
        }

        setSelected(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateBlock) {
            return;
        }

        setIsModalOpen(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        if (!canDeleteBlock) {
            return;
        }

        setIsDeleteOpen(true);
        handleMenuClose();
    };

    const handleConfirmDelete = async () => {
        if (!selected || !canDeleteBlock) {
            return;
        }

        await deleteElectiveBlock(selected.id);
        onRefresh();
        setIsDeleteOpen(false);
        setSelected(null);
    };

    return (
        <Box>
            <ListView<ElectiveBlock>
                items={data}
                icon={Extension}
                getTitle={(item) => item.elective_block_name}
                onMenuOpen={canUseBlockActions ? handleMenuOpen : undefined}
                onAddClick={canCreateBlock ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'didactics.blocks.add'})}
            />

            {canUseBlockActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateBlock ? handleEditClick : undefined}
                    onDelete={canDeleteBlock ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                    deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                />
            )}

            {canDeleteBlock && (
                <DeleteConfirmDialog
                    open={isDeleteOpen}
                    title={intl.formatMessage({id: 'didactics.blocks.deleteTitle'})}
                    description={intl.formatMessage(
                        {id: 'didactics.blocks.deleteDesc'},
                        {name: selected?.elective_block_name},
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

            {(canCreateBlock || canUpdateBlock) && (
                <BlockModal
                    open={isModalOpen}
                    block={selected}
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