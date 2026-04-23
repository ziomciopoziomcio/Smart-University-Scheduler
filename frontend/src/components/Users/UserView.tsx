import {useState} from 'react';
import {Box, Chip, Tooltip} from '@mui/material';
import {Person, Email, Badge, Shield, Security} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type User, deleteUser} from '@api';
import UserModal from './UserModal';

export const DEGREES_SHORT_MAP = new Map<string, string>([
    ['inz', 'inż.'],
    ['mgr', 'mgr'],
    ['dr', 'dr'],
    ['dr_hab', 'dr hab.'],
    ['prof', 'prof.']
]);

interface UserViewProps {
    data: User[];
    onRefresh: () => void;
}

export default function UserView({data, onRefresh}: UserViewProps) {
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: User) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedUser(item);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.id);
            onRefresh();
            setIsDeleteModalOpen(false);
        } catch {
            alert(intl.formatMessage({id: 'users.errors.delete'}));
        }
    };

    const formatDegree = (degreeVal: string | null) => {
        if (!degreeVal) return '';
        const short = DEGREES_SHORT_MAP.get(degreeVal) ?? degreeVal;
        return `${short} `;
    };

    return (
        <Box>
            <ListView
                items={data}
                icon={Person}
                getTitle={(item: User) => `${formatDegree(item.degree)}${item.name} ${item.surname}`}
                titleWidth="250px"
                columns={[
                    {
                        render: (item: User) => item.email,
                        icon: Email,
                        variant: 'secondary',
                        width: '250px'
                    },
                    {
                        render: (item: User) => (
                            <Tooltip
                                title={intl.formatMessage({id: item.two_factor_enabled ? 'users.view.2faEnabled' : 'users.view.2faDisabled'})}>
                                <Chip
                                    icon={<Shield/>}
                                    label="2FA"
                                    size="small"
                                    color={item.two_factor_enabled ? "success" : "default"}
                                    variant={item.two_factor_enabled ? "filled" : "outlined"}
                                    sx={{fontWeight: 'bold'}}
                                />
                            </Tooltip>
                        ),
                        icon: Security,
                        variant: 'primary',
                        width: '100px'
                    },
                    {
                        render: (item: User) => item.roles && item.roles.length > 0
                            ? item.roles.join(', ')
                            : intl.formatMessage({id: 'users.view.noRoles'}),
                        icon: Badge,
                        variant: 'primary',
                        width: '250px'
                    }
                ]}
                onMenuOpen={handleMenuOpen}
                onAddClick={() => {
                    setSelectedUser(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'users.view.add'})}
                emptyMessage={intl.formatMessage({id: 'users.view.empty'})}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                }}
                onEdit={() => {
                    setIsModalOpen(true);
                }}
                onDelete={() => {
                    setIsDeleteModalOpen(true);
                }}
                editLabel={intl.formatMessage({id: 'users.view.edit'})}
                deleteLabel={intl.formatMessage({id: 'users.view.delete'})}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                title={intl.formatMessage({id: 'users.view.deleteTitle'})}
                description={intl.formatMessage(
                    {id: 'users.view.deleteDesc'},
                    {name: `${selectedUser?.name} ${selectedUser?.surname}`}
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

            <UserModal
                open={isModalOpen}
                user={selectedUser}
                onClose={() => {
                    setIsModalOpen(false);
                }} onSuccess={onRefresh}
            />
        </Box>
    );
}