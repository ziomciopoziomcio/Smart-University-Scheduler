import {useState} from 'react';
import {Box} from '@mui/material';
import {Groups} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {type Unit, deleteUnit} from '@api';
import UnitModal from './UnitModal';
import {DeleteConfirmDialog, ListView, ActionMenu} from '@components/Common';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface UnitViewProps {
    data: Unit[];
    facultyId: number;
    onRefresh: () => void;
}

export function UnitView({data, facultyId, onRefresh}: UnitViewProps) {
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateUnit = hasAnyPermission([PERMISSIONS.UNIT_CREATE]);
    const canUpdateUnit = hasAnyPermission([PERMISSIONS.UNIT_UPDATE]);
    const canDeleteUnit = hasAnyPermission([PERMISSIONS.UNIT_DELETE]);
    const canUseUnitActions = canUpdateUnit || canDeleteUnit;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Unit) => {
        if (!canUseUnitActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedUnit(item);
    };

    const handleAddClick = () => {
        if (!canCreateUnit) {
            return;
        }

        setSelectedUnit(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateUnit) {
            return;
        }

        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleDeleteClick = () => {
        if (!canDeleteUnit) {
            return;
        }

        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUnit || !canDeleteUnit) {
            return;
        }

        try {
            await deleteUnit(selectedUnit.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedUnit(null);
        } catch {
            alert(intl.formatMessage({id: 'structures.unit.errors.delete'}));
        }
    };

    return (
        <Box>
            <ListView
                items={data}
                icon={Groups}
                getTitle={(item: Unit) => item.unit_name}
                titleWidth="700px"
                columns={[
                    {
                        render: (item: Unit) => item.unit_short,
                        variant: 'secondary',
                        width: '150px',
                    },
                    {
                        render: (item: Unit) => intl.formatMessage(
                            {id: 'plans.lecturerPlan.departmentSelect.lecturersCountValue'},
                            {count: item.lecturers_count || 0},
                        ),
                        variant: 'secondary',
                        width: '150px',
                    },
                ]}
                onMenuOpen={canUseUnitActions ? handleMenuOpen : undefined}
                onAddClick={canCreateUnit ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'structures.unit.add'})}
                emptyMessage="Brak jednostek dla tego wydziału."
            />

            {canUseUnitActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateUnit ? handleEditClick : undefined}
                    onDelete={canDeleteUnit ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'structures.unit.edit'})}
                    deleteLabel={intl.formatMessage({id: 'structures.unit.delete'})}
                />
            )}

            {(canCreateUnit || canUpdateUnit) && (
                <UnitModal
                    open={isModalOpen}
                    facultyId={facultyId}
                    unit={selectedUnit}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}

            {canDeleteUnit && (
                <DeleteConfirmDialog
                    open={isDeleteModalOpen}
                    title={intl.formatMessage({id: 'structures.unit.deleteTitle'})}
                    description={intl.formatMessage({id: 'structures.unit.deleteDesc'})}
                    cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'facilities.common.deleteConfirm'})}
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