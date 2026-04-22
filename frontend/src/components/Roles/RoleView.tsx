import {useState} from 'react';
import {Box} from '@mui/material';
import {Security} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';

import TileView from '@components/Common/TileView.tsx';
import ActionMenu from '@components/Common/ActionMenu.tsx';
import DeleteConfirmDialog from '@components/Common/DeleteConfirmDialog.tsx';
import {type Role} from '@api/types';
import {deleteRole} from '@api/users';
import RoleModal from './RoleModal';

interface RoleViewProps {
    data: Role[];
    onRefresh: () => void;
}

export default function RoleView({data, onRefresh}: RoleViewProps) {
    const intl = useIntl();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Role) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedRole(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedRole) return;
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
                getSubtitle={() => intl.formatMessage({id: 'roles.usersCountPending'})}
                onItemClick={(item: Role) => {
                    navigate(`/roles/${item.id}`);
                }} onMenuOpen={handleMenuOpen}
                onAddClick={() => {
                    setSelectedRole(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'roles.add'})}
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
                editLabel={intl.formatMessage({id: 'roles.edit'})}
                deleteLabel={intl.formatMessage({id: 'roles.delete'})}
            />

            <RoleModal
                open={isModalOpen}
                role={selectedRole}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                onSuccess={onRefresh}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                title={intl.formatMessage({id: 'roles.deleteTitle'})}
                description={intl.formatMessage(
                    {id: 'roles.deleteDesc'},
                    {name: selectedRole?.role_name || ''}
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
        </Box>
    );
}