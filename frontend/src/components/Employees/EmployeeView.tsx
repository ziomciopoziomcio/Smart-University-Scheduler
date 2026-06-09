import {useState} from 'react';
import {Box} from '@mui/material';
import {Email, AccountBalance} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {ListView, ActionMenu, DeleteConfirmDialog, UserAvatar} from '@components/Common';
import {type Employee, deleteEmployee} from '@api';
import EmployeeModal from './EmployeeModal';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface EmployeeViewProps {
    data: Employee[];
    onRefresh: () => void;
}

export default function EmployeeView({data, onRefresh}: EmployeeViewProps) {
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateEmployee = hasAnyPermission([PERMISSIONS.EMPLOYEE_CREATE]);
    const canUpdateEmployee = hasAnyPermission([PERMISSIONS.EMPLOYEE_UPDATE]);
    const canDeleteEmployee = hasAnyPermission([PERMISSIONS.EMPLOYEE_DELETE]);
    const canUseEmployeeActions = canUpdateEmployee || canDeleteEmployee;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Employee) => {
        if (!canUseEmployeeActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedEmployee(item);
    };

    const handleAddClick = () => {
        if (!canCreateEmployee) {
            return;
        }

        setSelectedEmployee(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateEmployee) {
            return;
        }

        setIsModalOpen(true);
    };

    const handleDeleteClick = () => {
        if (!canDeleteEmployee) {
            return;
        }

        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedEmployee || !canDeleteEmployee) {
            return;
        }

        try {
            await deleteEmployee(selectedEmployee.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedEmployee(null);
        } catch {
            alert(intl.formatMessage({id: 'academics.employees.errors.delete'}));
        }
    };

    return (
        <Box>
            <ListView
                items={data}
                getTitle={() => ''}
                titleWidth={0}
                titleSx={{minWidth: 0, width: 0, p: 0}}
                rowSx={{px: 1, minHeight: 58}}
                columns={[
                    {
                        render: (item: Employee) => (
                            <UserAvatar name={item.user.name} surname={item.user.surname}/>
                        ),
                    },
                    {
                        render: (item: Employee) => {
                            const validDegrees = ['none', 'inz', 'mgr', 'dr', 'dr_hab', 'prof'];
                            const degreeLabel = item.user.degree && validDegrees.includes(item.user.degree)
                                ? intl.formatMessage({id: `register.degrees.${item.user.degree}`}) + ' '
                                : (item.user.degree ? item.user.degree + ' ' : '');

                            return `${degreeLabel}${item.user.name} ${item.user.surname}`;
                        },
                        variant: 'primary',
                        width: '300px',
                    },
                    {
                        render: (item: Employee) => item.user.email,
                        icon: Email,
                        variant: 'secondary',
                        width: '250px',
                    },
                    {
                        render: (item: Employee) =>
                            item.unit?.unit_name
                            || item.faculty?.faculty_name
                            || intl.formatMessage({id: 'academics.employees.unassigned'}),
                        icon: AccountBalance,
                        variant: 'primary',
                        width: '350px',
                    },
                ]}
                onMenuOpen={canUseEmployeeActions ? handleMenuOpen : undefined}
                onAddClick={canCreateEmployee ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'academics.employees.add'})}
                emptyMessage={intl.formatMessage({id: 'academics.employees.empty'})}
            />

            {canUseEmployeeActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={() => {
                        setAnchorEl(null);
                    }}
                    onEdit={canUpdateEmployee ? handleEditClick : undefined}
                    onDelete={canDeleteEmployee ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'academics.employees.edit'})}
                    deleteLabel={intl.formatMessage({id: 'academics.employees.delete'})}
                />
            )}

            {canDeleteEmployee && (
                <DeleteConfirmDialog
                    open={isDeleteModalOpen}
                    title={intl.formatMessage({id: 'academics.employees.deleteTitle'})}
                    description={intl.formatMessage(
                        {id: 'academics.employees.deleteDesc'},
                        {name: `${selectedEmployee?.user.name} ${selectedEmployee?.user.surname}`},
                    )}
                    cancelButtonLabel={intl.formatMessage({id: 'academics.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'academics.common.deleteConfirm'})}
                    onConfirm={() => {
                        void handleConfirmDelete();
                    }}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                    }}
                />
            )}

            {(canCreateEmployee || canUpdateEmployee) && (
                <EmployeeModal
                    open={isModalOpen}
                    employee={selectedEmployee}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}
        </Box>
    );
}