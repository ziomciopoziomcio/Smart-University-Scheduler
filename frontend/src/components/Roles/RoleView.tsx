import {useState} from 'react';
import {Box} from '@mui/material';
import {Security} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';

import {TileView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type Role, deleteRole} from '@api';
import {RoleModal} from './RoleModal';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface RoleViewProps {
    data: Role[];
    onRefresh: () => void;
}

export function RoleView({data, onRefresh}: RoleViewProps) {
    const intl = useIntl();
    const navigate = useNavigate();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canOpenRoleDashboard = hasAnyPermission([
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.PERMISSIONS_VIEW,
    ]);

    const canCreateRole = hasAnyPermission([PERMISSIONS.ROLE_CREATE]);
    const canUpdateRole = hasAnyPermission([PERMISSIONS.ROLE_UPDATE]);
    const canDeleteRole = hasAnyPermission([PERMISSIONS.ROLE_DELETE]);
    const canUseRoleActions = canUpdateRole || canDeleteRole;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Role) => {
        if (!canUseRoleActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedRole(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAddClick = () => {
        if (!canCreateRole) {
            return;
        }

        setSelectedRole(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateRole) {
            return;
        }

        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleDeleteClick = () => {
        if (!canDeleteRole) {
            return;
        }

        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const handleItemClick = (item: Role) => {
        if (!canOpenRoleDashboard) {
            return;
        }

        navigate(`/roles/${item.id}`);
    };

    const handleConfirmDelete = async () => {
        if (!selectedRole || !canDeleteRole) {
            return;
        }

        try {
            await deleteRole(selectedRole.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedRole(null);
        } catch {
            alert(intl.formatMessage({id: 'roles.errors.delete'}));
        }
    };

    return (
        <Box>
            <TileView
                items={data}
                icon={Security}
                variant="flat"
                iconSize={50}
                getTitle={(item: Role) => item.role_name}
                getSubtitle={(item: Role) => intl.formatMessage(
                    {id: 'roles.usersCount'},
                    {count: item.users_count ?? 0},
                )}
                onItemClick={handleItemClick}
                onMenuOpen={canUseRoleActions ? handleMenuOpen : undefined}
                onAddClick={canCreateRole ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'roles.add'})}
            />

            {canUseRoleActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateRole ? handleEditClick : undefined}
                    onDelete={canDeleteRole ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'roles.edit'})}
                    deleteLabel={intl.formatMessage({id: 'roles.delete'})}
                />
            )}

            {(canCreateRole || canUpdateRole) && (
                <RoleModal
                    open={isModalOpen}
                    role={selectedRole}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}

            {canDeleteRole && (
                <DeleteConfirmDialog
                    open={isDeleteModalOpen}
                    title={intl.formatMessage({id: 'roles.deleteTitle'})}
                    description={intl.formatMessage(
                        {id: 'roles.deleteDesc'},
                        {name: selectedRole?.role_name || ''},
                    )}
                    cancelButtonLabel={intl.formatMessage({id: 'users.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'users.common.deleteConfirm'})}
                    onConfirm={() => {
                        void handleConfirmDelete();
                    }}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                    }}
                />
            )}
        </Box>
    );
}